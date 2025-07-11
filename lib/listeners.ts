"use client"

import { Database } from './database';
import { ImageData, Tag } from '@/types';

// 监听器管理类
export class ListenerManager {
  private static listeners: Map<string, () => void> = new Map();
  private static isOnline = true;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 3;
  private static reconnectDelay = 1000; // 1秒

  // 初始化网络状态监听
  static initNetworkListener() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.isOnline = navigator.onLine;
    }
  }

  // 处理网络连接
  private static handleOnline() {
    console.log('🌐 网络已连接，重新建立监听器');
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.reconnectAllListeners();
  }

  // 处理网络断开
  private static handleOffline() {
    console.log('🔌 网络已断开，暂停监听器');
    this.isOnline = false;
  }

  // 重新连接所有监听器
  private static reconnectAllListeners() {
    if (!this.isOnline || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 尝试重新连接监听器 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      // 这里可以添加重新建立监听器的逻辑
      // 由于监听器通常在组件中管理，这里主要是记录状态
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // 注册监听器
  static registerListener(key: string, unsubscribe: () => void) {
    // 确保 listeners Map 已初始化
    if (!this.listeners) {
      this.listeners = new Map();
    }
    
    // 如果已存在同名监听器，先取消订阅
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }
    this.listeners.set(key, unsubscribe);
    console.log(`📡 注册监听器: ${key}`);
  }

  // 取消监听器
  static unregisterListener(key: string) {
    if (!this.listeners) {
      return;
    }
    
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
      console.log(`🔇 取消监听器: ${key}`);
    }
  }

  // 取消所有监听器
  static unregisterAllListeners() {
    console.log('🔇 取消所有监听器');
    if (this.listeners) {
      this.listeners.forEach((unsubscribe, key) => {
        unsubscribe();
        console.log(`🔇 取消监听器: ${key}`);
      });
      this.listeners.clear();
    }
  }

  // 获取监听器状态
  static getListenerStatus() {
    return {
      isOnline: this.isOnline,
      activeListeners: this.listeners ? Array.from(this.listeners.keys()) : [],
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // 错误处理
  static handleError(listenerKey: string, error: Error) {
    console.error(`❌ 监听器错误 [${listenerKey}]:`, error);
    
    // 如果是网络错误，尝试重新连接
    if (error.message.includes('network') || error.message.includes('offline')) {
      this.isOnline = false;
      setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.handleOnline();
        }
      }, this.reconnectDelay);
    }
  }

  // 图片监听器
  static subscribeToImages(
    callback: (images: ImageData[]) => void,
    key: string = 'images'
  ) {
    const unsubscribe = Database.subscribeToImages(
      callback,
      (error) => this.handleError(key, error)
    );
    this.registerListener(key, unsubscribe);
    return unsubscribe;
  }

  // 标签监听器
  static subscribeToTags(
    callback: (tags: Tag[]) => void,
    key: string = 'tags'
  ) {
    const unsubscribe = Database.subscribeToTags(
      callback,
      (error) => this.handleError(key, error)
    );
    this.registerListener(key, unsubscribe);
    return unsubscribe;
  }

  // 单个图片监听器
  static subscribeToImage(
    id: string,
    callback: (image: ImageData | null) => void,
    key?: string
  ) {
    const listenerKey = key || `image-${id}`;
    const unsubscribe = Database.subscribeToImage(
      id,
      callback,
      (error) => this.handleError(listenerKey, error)
    );
    this.registerListener(listenerKey, unsubscribe);
    return unsubscribe;
  }

  // 搜索监听器 - 暂时使用普通图片监听器
  static subscribeToSearchImages(
    searchQuery: string,
    tags: Tag[],
    callback: (images: ImageData[]) => void,
    key: string = 'search'
  ) {
    // 由于Database没有subscribeToSearchImages方法，使用subscribeToImages
    const unsubscribe = Database.subscribeToImages(
      callback,
      (error) => this.handleError(key, error)
    );
    this.registerListener(key, unsubscribe);
    return unsubscribe;
  }
}


// 初始化监听器管理器
if (typeof window !== 'undefined') {
  ListenerManager.initNetworkListener();
}