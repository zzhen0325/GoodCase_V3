import { db } from './firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Firestore 连接状态管理
class FirestoreConnectionManager {
  private isConnected = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private listeners: Array<(connected: boolean) => void> = [];

  constructor() {
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    // 监听网络状态变化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('网络已连接，尝试重新连接 Firestore');
        this.reconnect();
      });

      window.addEventListener('offline', () => {
        console.log('网络已断开');
        this.setConnectionStatus(false);
      });
    }
  }

  private setConnectionStatus(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.notifyListeners(connected);
    }
  }

  private notifyListeners(connected: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('连接状态监听器错误:', error);
      }
    });
  }

  public onConnectionChange(listener: (connected: boolean) => void) {
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.isConnected);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async reconnect(): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Firestore 重连次数已达上限');
      return false;
    }

    this.reconnectAttempts++;
    console.log(`尝试重连 Firestore (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    try {
      // 先禁用网络连接
      await disableNetwork(db);
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      
      // 重新启用网络连接
      await enableNetwork(db);
      
      console.log('Firestore 重连成功');
      this.reconnectAttempts = 0;
      this.setConnectionStatus(true);
      return true;
    } catch (error) {
      console.error('Firestore 重连失败:', error);
      
      // 指数退避
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // 最大30秒
      
      // 如果还有重试次数，继续尝试
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.reconnect(), this.reconnectDelay);
      } else {
        this.setConnectionStatus(false);
      }
      
      return false;
    }
  }

  public async forceReconnect(): Promise<boolean> {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    return this.reconnect();
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async testConnection(): Promise<boolean> {
    try {
      // 尝试执行一个简单的 Firestore 操作来测试连接
      const { doc, getDoc } = await import('firebase/firestore');
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      
      this.setConnectionStatus(true);
      return true;
    } catch (error) {
      console.error('Firestore 连接测试失败:', error);
      this.setConnectionStatus(false);
      return false;
    }
  }
}

// 创建全局实例
export const firestoreConnectionManager = new FirestoreConnectionManager();

// 导出便捷函数
export const onFirestoreConnectionChange = (listener: (connected: boolean) => void) => {
  return firestoreConnectionManager.onConnectionChange(listener);
};

export const reconnectFirestore = () => {
  return firestoreConnectionManager.forceReconnect();
};

export const getFirestoreConnectionStatus = () => {
  return firestoreConnectionManager.getConnectionStatus();
};

export const testFirestoreConnection = () => {
  return firestoreConnectionManager.testConnection();
};

// 自动处理 WebChannel 错误
if (typeof window !== 'undefined') {
  // 监听控制台错误，特别是 WebChannel 相关错误
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('WebChannelConnection RPC') && message.includes('transport errored')) {
      console.log('检测到 Firestore WebChannel 错误，尝试重连...');
      firestoreConnectionManager.reconnect();
    }
    originalConsoleWarn.apply(console, args);
  };
}