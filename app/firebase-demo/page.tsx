import FirebaseStorageDemo from '@/components/firebase-storage-demo';

/**
 * Firebase Storage 演示页面
 */
export default function FirebaseDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FirebaseStorageDemo />
    </div>
  );
}

export const metadata = {
  title: 'Firebase Storage 演示',
  description: '展示Firebase Storage文件上传、下载、删除等功能的演示页面',
};