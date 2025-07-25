import { toast as sonnerToast } from 'sonner'
import { createElement } from 'react'

export interface ProgressToastOptions {
  progress: number // 0-100
  type?: 'upload' | 'save' | 'delete' | 'loading'
  message: string
  description?: string
}

export interface ToastProgressUpdate {
  progress: number
  message?: string
  description?: string
}

// 创建进度条组件
function createProgressToast(options: ProgressToastOptions) {
  const { progress, type = 'loading', message, description } = options
  
  const getIcon = () => {
    switch (type) {
      case 'upload':
        return '📤'
      case 'save':
        return '💾'
      case 'delete':
        return '🗑️'
      default:
        return '⏳'
    }
  }

  const getProgressColor = () => {
    switch (type) {
      case 'upload':
        return 'bg-blue-500'
      case 'save':
        return 'bg-green-500'
      case 'delete':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return createElement('div', 
    { className: 'flex flex-col gap-2 min-w-[280px]' },
    createElement('div',
      { className: 'flex items-center gap-2' },
      createElement('span', { className: 'text-lg' }, getIcon()),
      createElement('div',
        { className: 'flex-1' },
        createElement('div', { className: 'font-medium text-sm' }, message),
        description && createElement('div', { className: 'text-xs text-muted-foreground' }, description)
      ),
      createElement('span', 
        { className: 'text-xs font-mono text-muted-foreground' },
        `${Math.round(progress)}%`
      )
    ),
    createElement('div',
      { className: 'w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700' },
      createElement('div', {
        className: `h-2 rounded-full transition-all duration-300 ease-out ${getProgressColor()}`,
        style: { width: `${Math.min(100, Math.max(0, progress))}%` }
      })
    )
  )
}

// 增强的toast对象
export const toast = {
  // 基础sonner方法
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,

  // 新增进度条方法
  progress: (options: ProgressToastOptions): string | number => {
    return sonnerToast(createProgressToast(options), {
      duration: Infinity, // 进度条toast不自动消失
    })
  },

  // 更新进度条
  updateProgress: (toastId: string | number, update: ToastProgressUpdate) => {
    const options: ProgressToastOptions = {
      progress: update.progress,
      message: update.message || '',
      description: update.description,
      type: 'loading' // 默认类型，实际使用时应该保持原类型
    }
    
    sonnerToast(createProgressToast(options), {
      id: toastId,
      duration: update.progress >= 100 ? 2000 : Infinity,
    })
  },

  // 便捷方法：上传进度
  uploadProgress: (progress: number, message: string = '上传中...', description?: string): string | number => {
    return toast.progress({
      progress,
      type: 'upload',
      message,
      description
    })
  },

  // 便捷方法：保存进度
  saveProgress: (progress: number, message: string = '保存中...', description?: string): string | number => {
    return toast.progress({
      progress,
      type: 'save',
      message,
      description
    })
  },

  // 便捷方法：删除进度
  deleteProgress: (progress: number, message: string = '删除中...', description?: string): string | number => {
    return toast.progress({
      progress,
      type: 'delete',
      message,
      description
    })
  },

  // 完成进度并显示成功消息
  completeProgress: (toastId: string | number, message: string = '操作完成') => {
    sonnerToast.success(message, { id: toastId })
  },

  // 进度失败并显示错误消息
  failProgress: (toastId: string | number, message: string = '操作失败') => {
    sonnerToast.error(message, { id: toastId })
  }
}

// 默认导出
export default toast