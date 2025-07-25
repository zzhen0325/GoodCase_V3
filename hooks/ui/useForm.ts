import { useState, useCallback, useEffect } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validate, onSubmit } = options;
  
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 设置字段值
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // 设置多个字段值
  const setValues_ = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);
  
  // 设置字段为已触摸
  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);
  
  // 设置字段错误
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);
  
  // 清除字段错误
  const clearFieldError = useCallback((name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);
  
  // 验证表单
  const validateForm = useCallback(() => {
    if (!validate) return true;
    
    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    return Object.keys(validationErrors).length === 0;
  }, [values, validate]);
  
  // 验证单个字段
  const validateField = useCallback((name: keyof T) => {
    if (!validate) return true;
    
    const validationErrors = validate(values);
    const fieldError = validationErrors[name];
    
    if (fieldError) {
      setFieldError(name, fieldError);
      return false;
    } else {
      clearFieldError(name);
      return true;
    }
  }, [values, validate, setFieldError, clearFieldError]);
  
  // 处理字段变化
  const handleChange = useCallback((name: keyof T) => {
    return (value: any) => {
      setValue(name, value);
      setFieldTouched(name, true);
      
      // 如果字段已被触摸，立即验证
      if (touched[name]) {
        validateField(name);
      }
    };
  }, [setValue, setFieldTouched, touched, validateField]);
  
  // 处理字段失焦
  const handleBlur = useCallback((name: keyof T) => {
    return () => {
      setFieldTouched(name, true);
      validateField(name);
    };
  }, [setFieldTouched, validateField]);
  
  // 提交表单
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // 标记所有字段为已触摸
    const allFieldNames = Object.keys(values) as (keyof T)[];
    const allTouched = allFieldNames.reduce((acc, name) => {
      acc[name] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouched(allTouched);
    
    // 验证表单
    if (!validateForm()) {
      return;
    }
    
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('表单提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);
  
  // 重置表单
  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // 检查表单是否有效
  const isValid = Object.keys(errors).length === 0;
  
  // 检查表单是否为脏数据（已修改）
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    
    setValue,
    setValues: setValues_,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    
    validateForm,
    validateField,
    
    handleChange,
    handleBlur,
    handleSubmit,
    
    reset
  };
}