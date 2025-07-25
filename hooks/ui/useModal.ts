import { useState, useCallback } from 'react';

interface UseModalOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useModal(options: UseModalOptions = {}) {
  const { defaultOpen = false, onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);
  
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);
  
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
}

// 多模态框管理hook
export function useMultiModal<T extends string>(modalNames: T[]) {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());
  
  const openModal = useCallback((name: T) => {
    setOpenModals(prev => new Set(prev).add(name));
  }, []);
  
  const closeModal = useCallback((name: T) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
  }, []);
  
  const toggleModal = useCallback((name: T) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);
  
  const closeAllModals = useCallback(() => {
    setOpenModals(new Set());
  }, []);
  
  const isModalOpen = useCallback((name: T) => {
    return openModals.has(name);
  }, [openModals]);
  
  return {
    openModals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isModalOpen
  };
}