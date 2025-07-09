"use client"

import React, { createContext, useContext } from 'react';
import { useToast, ToastOptions, ToastInstance } from '@/hooks/use-toast';
import { Toast, ToastContainer } from '@/components/ui/toast';

interface ToastContextType {
  toasts: ToastInstance[];
  toast: {
    loading: (title: string, description?: string, progress?: number) => string;
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
    updateProgress: (id: string, progress: number) => void;
    resolve: (id: string, title?: string, description?: string) => void;
    reject: (id: string, title?: string, description?: string) => void;
    dismiss: (id: string) => void;
    clear: () => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, toast, removeToast } = useToast();

  const contextValue: ToastContextType = {
    toasts,
    toast,
    removeToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer>
        {toasts.map((toastData) => (
          <Toast
            key={toastData.id}
            id={toastData.id}
            type={toastData.type}
            title={toastData.title}
            description={toastData.description}
            progress={toastData.progress}
            duration={toastData.duration}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}