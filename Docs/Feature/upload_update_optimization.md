# 上传和更新图片逻辑优化方案

## 现状分析

### 当前实现的问题

#### 1. 上传逻辑问题
**位置**: `app/api/upload/route.ts`

**问题**:
- ❌ 缺少原子性保证：没有使用 Firestore batch 操作
- ❌ 缺少标签 usageCount 维护：上传时没有更新标签的使用次数
- ❌ 缺少异常回滚：上传失败时没有清理已上传的 Storage 文件
- ❌ 缺少图片元数据获取：直接使用传入的宽高，没有实际解析
- ❌ 缺少权限控制：没有验证用户权限

#### 2. 更新逻辑问题
**位置**: `app/api/images/[id]/route.ts`

**问题**:
- ❌ 缺少批量操作：没有使用 batch 确保原子性
- ❌ 缺少标签 usageCount 维护：更新标签时没有同步维护使用次数
- ❌ 缺少差异计算：直接替换所有标签/提示词，没有计算添加/移除的差异
- ❌ 缺少数据验证：没有验证标签/提示词是否存在

#### 3. 前端实现问题
**位置**: `hooks/use-image-operations.ts`

**问题**:
- ❌ 缺少图片元数据获取：没有解析图片的实际宽高
- ❌ 缺少错误处理：错误处理不够完善
- ❌ 缺少进度反馈：没有上传进度显示

## 优化方案

### 1. 上传逻辑优化

#### 1.1 添加图片元数据获取
```typescript
// 新增: lib/image-utils.ts
export const getImageMetadata = async (file: File): Promise<{
  width: number;
  height: number;
  fileSize: number;
  format: string;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        fileSize: file.size,
        format: file.type.split('/')[1] || 'png'
      });
    };
    img.src = URL.createObjectURL(file);
  });
};
```

#### 1.2 优化上传 API
```typescript
// 优化: app/api/upload/route.ts
export async function POST(request: NextRequest) {
  const batch = db.batch();
  const imageId = crypto.randomUUID();
  
  try {
    const { imageUrl, title, tagIds = [], promptIds = [] } = await request.json();
    
    // 1. 获取图片元数据
    const metadata = await getImageMetadata(file);
    
    // 2. 上传到 Storage
    const storageRef = ref(storage, `images/${imageId}`);
    const uploadResult = await uploadString(storageRef, imageUrl, 'data_url');
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    
    // 3. 创建 DocumentReference
    const tagRefs = tagIds.map(id => doc(db, 'tags', id));
    const promptRefs = promptIds.map(id => doc(db, 'prompts', id));
    
    // 4. 创建图片文档
    const imageRef = doc(db, 'images', imageId);
    batch.set(imageRef, {
      url: downloadUrl,
      title,
      ...metadata,
      tagRefs,
      promptRefs,
      sortOrder: maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 5. 更新标签 usageCount
    tagRefs.forEach(ref => {
      batch.update(ref, {
        usageCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });
    
    // 6. 提交批量操作
    await batch.commit();
    
    return NextResponse.json({ success: true, data: { imageId } });
  } catch (error) {
    // 7. 异常回滚：删除已上传的文件
    if (imageId) {
      await deleteObject(ref(storage, `images/${imageId}`)).catch(() => {});
    }
    throw error;
  }
}
```

### 2. 更新逻辑优化

#### 2.1 添加差异计算
```typescript
// 新增: lib/update-helpers.ts
export const calculateTagDiff = (
  currentTagRefs: DocumentReference[],
  newTagIds: string[]
): {
  addRefs: DocumentReference[];
  removeRefs: DocumentReference[];
} => {
  const newTagRefs = newTagIds.map(id => doc(db, 'tags', id));
  const addRefs = newTagRefs.filter(ref => 
    !currentTagRefs.some(r => r.isEqual(ref))
  );
  const removeRefs = currentTagRefs.filter(ref => 
    !newTagRefs.some(r => r.isEqual(ref))
  );
  
  return { addRefs, removeRefs };
};
```

#### 2.2 优化更新 API
```typescript
// 优化: app/api/images/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const batch = db.batch();
  
  try {
    const { id } = await params;
    const { title, tagIds = [], promptIds = [] } = await request.json();
    
    const imageRef = db.collection('images').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      throw new Error('图片不存在');
    }
    
    const currentData = imageDoc.data() as FirestoreImage;
    
    // 1. 计算标签差异
    const { addTagRefs, removeTagRefs } = calculateTagDiff(
      currentData.tagRefs || [],
      tagIds
    );
    
    // 2. 计算提示词差异
    const { addPromptRefs, removePromptRefs } = calculatePromptDiff(
      currentData.promptRefs || [],
      promptIds
    );
    
    // 3. 更新图片文档
    const updateData: Partial<FirestoreImage> = {
      updatedAt: Timestamp.now(),
    };
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (tagIds.length > 0 || currentData.tagRefs?.length > 0) {
      updateData.tagRefs = tagIds.map(id => db.collection('tags').doc(id));
    }
    
    if (promptIds.length > 0 || currentData.promptRefs?.length > 0) {
      updateData.promptRefs = promptIds.map(id => db.collection('prompts').doc(id));
    }
    
    batch.update(imageRef, updateData);
    
    // 4. 更新标签 usageCount
    addTagRefs.forEach(ref => {
      batch.update(ref, {
        usageCount: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });
    });
    
    removeTagRefs.forEach(ref => {
      batch.update(ref, {
        usageCount: FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      });
    });
    
    // 5. 提交批量操作
    await batch.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}
```

### 3. 前端优化

#### 3.1 优化上传逻辑
```typescript
// 优化: hooks/use-image-operations.ts
const handleImageUpload = useCallback(
  async (file: File, imageName: string, prompts: PromptBlock[] = [], tagIds: string[] = []) => {
    try {
      // 1. 获取图片元数据
      const metadata = await getImageMetadata(file);
      
      // 2. 处理新提示词
      const newPrompts = prompts.filter(p => p.id.startsWith('temp_'));
      const existingPromptIds = prompts
        .filter(p => !p.id.startsWith('temp_'))
        .map(p => p.id);
      
      const createdPromptIds = await Promise.all(
        newPrompts.map(async (prompt) => {
          const response = await fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: prompt.title,
              content: prompt.content || prompt.text || '',
              color: prompt.color || '#3b82f6',
              order: prompt.order || prompt.sortOrder || 0,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`创建提示词 "${prompt.title}" 失败`);
          }
          
          const result = await response.json();
          return result.data?.id || result.prompt?.id;
        })
      );
      
      // 3. 读取文件为 base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // 4. 上传图片
      const allPromptIds = [...existingPromptIds, ...createdPromptIds];
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64,
          title: imageName,
          ...metadata,
          tagIds: tagIds || [],
          promptIds: allPromptIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }
      
      const { data: image } = await response.json();
      
      // 5. 更新本地状态
      setImages((prev) => [image, ...prev]);
      
    } catch (error) {
      console.error('❌ 上传失败:', error);
      throw error;
    }
  },
  [setImages]
);
```

#### 3.2 添加进度反馈
```typescript
// 新增: hooks/use-upload-progress.ts
export const useUploadProgress = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadWithProgress = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ) => {
    setIsUploading(true);
    setProgress(0);
    
    try {
      // 模拟上传进度
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 100);
      
      // 执行上传
      const result = await uploadFile(file);
      
      clearInterval(interval);
      setProgress(100);
      onProgress?.(100);
      
      return result;
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  return { progress, isUploading, uploadWithProgress };
};
```

### 4. 权限控制优化

#### 4.1 添加用户验证
```typescript
// 新增: lib/auth-helpers.ts
export const verifyUserPermission = async (userId: string, imageId: string) => {
  const imageDoc = await db.collection('images').doc(imageId).get();
  if (!imageDoc.exists) {
    throw new Error('图片不存在');
  }
  
  const imageData = imageDoc.data();
  if (imageData.createdBy !== userId) {
    throw new Error('无权限操作此图片');
  }
  
  return true;
};
```

#### 4.2 更新 Firestore 规则
```javascript
// 优化: firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /images/{imageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    match /tags/{tagId} {
      allow read: if true;
      allow update: if request.auth != null && 
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'color', 'order', 'usageCount', 'updatedAt']) &&
        (request.resource.data.usageCount == null || 
         request.resource.data.usageCount == resource.data.usageCount + 1 || 
         request.resource.data.usageCount == resource.data.usageCount - 1));
    }
  }
}
```

## 实施计划

### 第一阶段：核心优化（1-2天）
1. ✅ 添加图片元数据获取功能
2. ✅ 实现批量操作和原子性保证
3. ✅ 添加标签 usageCount 维护
4. ✅ 实现异常回滚机制

### 第二阶段：前端优化（1天）
1. ✅ 优化前端上传逻辑
2. ✅ 添加进度反馈
3. ✅ 改进错误处理

### 第三阶段：权限控制（1天）
1. ✅ 添加用户验证
2. ✅ 更新 Firestore 规则
3. ✅ 实现权限检查

### 第四阶段：测试和优化（1天）
1. ✅ 添加单元测试
2. ✅ 性能测试
3. ✅ 安全测试

## 预期效果

### 性能提升
- 原子性操作确保数据一致性
- 批量操作减少网络请求
- 异常回滚避免垃圾数据

### 功能完善
- 准确的图片元数据
- 实时的标签使用统计
- 完善的权限控制

### 用户体验
- 上传进度反馈
- 更好的错误提示
- 更快的响应速度

---

**负责人**: 开发团队
**状态**: 规划中
**优先级**: 高 