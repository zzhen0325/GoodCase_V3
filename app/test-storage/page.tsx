'use client';

import { useState } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TestStoragePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testStorage = async () => {
    setLoading(true);
    setResult('开始测试 Firebase Storage 连接...');
    
    try {
      // 创建一个简单的测试文件
      const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
      
      setResult(prev => prev + '\n创建测试文件成功');
      
      // 创建存储引用
      const storageRef = ref(storage, `test/${Date.now()}.txt`);
      setResult(prev => prev + '\n创建存储引用成功');
      
      // 上传文件
      setResult(prev => prev + '\n开始上传文件...');
      const snapshot = await uploadBytes(storageRef, testFile);
      setResult(prev => prev + '\n✅ 文件上传成功!');
      
      // 获取下载URL
      setResult(prev => prev + '\n获取下载URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      setResult(prev => prev + `\n✅ 获取下载URL成功: ${downloadURL}`);
      
      setResult(prev => prev + '\n\n🎉 Firebase Storage 连接测试成功!');
      
    } catch (error: any) {
      console.error('Storage 测试失败:', error);
      setResult(prev => prev + `\n❌ 测试失败: ${error.message}`);
      setResult(prev => prev + `\n错误代码: ${error.code || 'unknown'}`);
      setResult(prev => prev + `\n完整错误: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Storage 连接测试</h1>
      
      <button
        onClick={testStorage}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? '测试中...' : '开始测试'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">测试结果:</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-100 rounded">
        <h2 className="text-lg font-semibold mb-2">当前配置:</h2>
        <p><strong>Project ID:</strong> lemonzz</p>
        <p><strong>Storage Bucket:</strong> lemon8.appspot.com</p>
        <p><strong>Auth Domain:</strong> lemonzz.firebaseapp.com</p>
      </div>
    </div>
  );
}