import React, { useState, useEffect, useRef, ReactNode, HTMLAttributes } from "react";
import { throttle } from "@/lib/utils";

/**
 * 磁吸效果组件 - 当鼠标靠近时元素会跟随移动，产生磁吸效果
 * @param children - 组件内部内容
 * @param padding - 感应范围扩展距离(px)
 * @param disabled - 是否禁用效果
 * @param magnetStrength - 磁吸强度(值越小吸附力越强)
 * @param activeTransition - 激活状态的过渡动画
 * @param inactiveTransition - 非激活状态的过渡动画
 * @param wrapperClassName - 外层容器类名
 * @param innerClassName - 内层元素类名
 */
interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number; // 鼠标感应范围扩展距离
  disabled?: boolean; // 是否禁用磁吸效果
  magnetStrength?: number; // 磁吸强度系数
  activeTransition?: string; // 激活时的过渡动画
  inactiveTransition?: string; // 非激活时的过渡动画
  wrapperClassName?: string; // 外层容器类名
  innerClassName?: string; // 内层元素类名
  onStateChange?: (isActive: boolean, position: { x: number; y: number }) => void; // 状态变化回调
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 500, // 默认感应范围500px
  disabled = false, // 默认启用效果
  magnetStrength = 4, // 默认磁吸强度
  // 激活状态的自定义缓动函数(带回弹效果)
  activeTransition = "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
  // 非激活状态的自定义缓动函数(带回弹效果)
  inactiveTransition = "transform 0.8s linear(0,.5737 7.6%,.8382 11.87%,.9463 14.19%,1.0292 16.54%,1.0886 18.97%,1.1258 21.53%,1.137 22.97%,1.1424 24.48%,1.1423 26.1%,1.1366 27.86%,1.1165 31.01%,1.0507 38.62%,1.0219 42.57%,.9995 46.99%,.9872 51.63%,.9842 58.77%,1.0011 81.26%,1)",
  wrapperClassName = "", // 外层容器样式类
  innerClassName = "", // 内层元素样式类
  onStateChange, // 状态变化回调
  ...props
}) => {
  const [isActive, setIsActive] = useState<boolean>(false); // 是否处于激活状态
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // 元素偏移位置
  const magnetRef = useRef<HTMLDivElement>(null); // 元素引用

  // 监听鼠标移动事件，计算元素偏移
  useEffect(() => {
    if (disabled) { // 禁用状态不执行效果
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      // 获取元素位置和尺寸
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2; // 元素中心点X坐标
      const centerY = top + height / 2; // 元素中心点Y坐标

      // 计算鼠标与元素中心的距离
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      // 判断鼠标是否在感应范围内
      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        // 计算元素偏移量(除以强度系数以控制吸附力度)
        const offsetX = (e.clientX - centerX) / magnetStrength;
        const offsetY = (e.clientY - centerY) / magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
        
        // 通知状态变化
        if (onStateChange) {
          onStateChange(true, { x: offsetX, y: offsetY });
        }
      } else {
        setIsActive(false); // 鼠标离开感应范围，重置状态
        setPosition({ x: 0, y: 0 });
        
        // 通知状态变化
        if (onStateChange) {
          onStateChange(false, { x: 0, y: 0 });
        }
      }
    };

    // 使用节流函数优化鼠标移动事件，限制执行频率为16ms（约60fps）
    const throttledMouseMove = throttle(handleMouseMove, 16);

    // 添加和移除事件监听
    window.addEventListener("mousemove", throttledMouseMove);
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
    };
  }, [padding, disabled, magnetStrength]); // 依赖项变化时重新计算

  // 根据状态选择过渡动画
  const transitionStyle = isActive ? activeTransition : inactiveTransition;
  // 根据偏移量计算旋转角度
  const rotationAngle = isActive ? (position.x / 10) : 0;
  // 根据状态设置缩放比例
  const scaleValue = isActive ? 1.1 : 1;

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{ position: "relative", width: "100%", height: "100%" }}
      {...props}
    >
      <div
        className={innerClassName}
        style={{
          // 应用位移、旋转和缩放效果
          transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotationAngle}deg) scale(${scaleValue})`,
          transition: transitionStyle, // 应用过渡动画
          willChange: "transform transform 0.8s linear(0,.5737 7.6%,.8382 11.87%,.9463 14.19%,1.0292 16.54%,1.0886 18.97%,1.1258 21.53%,1.137 22.97%,1.1424 24.48%,1.1423 26.1%,1.1366 27.86%,1.1165 31.01%,1.0507 38.62%,1.0219 42.57%,.9995 46.99%,.9872 51.63%,.9842 58.77%,1.0011 81.26%,1)", // 优化性能提示
          width: "100%",
          height: "100%",
          // 激活状态添加阴影效果
          filter: isActive ? "drop-shadow-lg drop-shadow(0 20px 40px rgb(0 0 0 / 0.2))" : "none",
          // border: isActive ? "2px solid white" : "none", // 激活状态边框效果(已注释)
          borderRadius: isActive ? "2xl" : "0", // 激活状态圆角效果
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;