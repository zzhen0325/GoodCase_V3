import React, { useState, useEffect, useRef, ReactNode, HTMLAttributes } from "react";

interface Point {
  x: number;
  y: number;
}

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
  // Enhanced mode properties
  enhanced?: boolean;
  sensitivity?: number; // 0.01-0.1, 控制偏移敏感度
  elasticStrength?: number; // 弹性强度 0-1
  velocityFactor?: number; // 速度影响因子
  layers?: number; // 支持的层数
  layerOffsets?: number[]; // 每层的偏移系数
  layerDelays?: number[]; // 每层的动画延迟(ms)
  easingCurve?: 'elastic' | 'smooth' | 'custom';
  customEasing?: string; // 自定义缓动曲线
}

// Spencer Gabor inspired easing curves
const EASING_CURVES = {
  elastic: 'linear(0, .5737 7.6%, .8382 11.87%, .9463 14.19%, 1.0292 16.54%, 1.0886 18.97%, 1.1258 21.53%, 1.137 22.97%, 1.1424 24.48%, 1.1423 26.1%, 1.1366 27.86%, 1.1165 31.01%, 1.0507 38.62%, 1.0219 42.57%, .9995 46.99%, .9872 51.63%, .9842 58.77%, 1.0011 81.26%, 1)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 150,
  disabled = false,
  magnetStrength = 2,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.5s ease-in-out",
  wrapperClassName = "",
  innerClassName = "",
  // Enhanced mode props
  enhanced = true,
  sensitivity = 0.03,
  elasticStrength = 0.8,
  velocityFactor = 0.5,
  layers = 1,
  layerOffsets = [1],
  layerDelays = [0],
  easingCurve = 'elastic',
  customEasing,
  ...props
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [layerPositions, setLayerPositions] = useState<Point[]>([]);
  const [velocity, setVelocity] = useState<number>(0);
  const magnetRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const lastTime = useRef<number>(Date.now());

  // Enhanced mode utility functions
  const calculateVelocity = (currentPos: Point, lastPos: Point, deltaTime: number): number => {
    const distance = Math.sqrt((currentPos.x - lastPos.x) ** 2 + (currentPos.y - lastPos.y) ** 2);
    return deltaTime > 0 ? distance / deltaTime : 0;
  };

  const calculateEnhancedOffset = (distance: number, maxDistance: number, velocity: number): number => {
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const easeOut = 1 - Math.pow(1 - normalizedDistance, 3);
    const velocityMultiplier = 1 + (velocity * velocityFactor * 0.001);
    return easeOut * sensitivity * velocityMultiplier;
  };

  const getEasingCurve = (): string => {
    if (customEasing) return customEasing;
    if (easingCurve === 'custom') return customEasing || EASING_CURVES.elastic;
    return EASING_CURVES[easingCurve as keyof typeof EASING_CURVES] || EASING_CURVES.elastic;
  };

  // Initialize layer positions
  useEffect(() => {
    if (enhanced) {
      const initialPositions = Array(layers).fill(null).map(() => ({ x: 0, y: 0 }));
      setLayerPositions(initialPositions);
    }
  }, [enhanced, layers]);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      if (enhanced) {
        setLayerPositions(Array(layers).fill({ x: 0, y: 0 }));
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      const currentTime = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY };
      const deltaTime = currentTime - lastTime.current;
      
      // Calculate velocity for enhanced mode
      const currentVelocity = enhanced ? 
        calculateVelocity(currentPos, lastMousePos.current, deltaTime) : 0;
      
      if (enhanced) {
        setVelocity(currentVelocity);
      }
      
      lastMousePos.current = currentPos;
      lastTime.current = currentTime;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);
      const totalDistance = Math.sqrt(distX * distX + distY * distY);
      const maxDistance = Math.sqrt((width / 2 + padding) ** 2 + (height / 2 + padding) ** 2);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        
        if (enhanced) {
          // Enhanced mode: precise offset calculation with velocity
          const offsetMagnitude = calculateEnhancedOffset(totalDistance, maxDistance, currentVelocity);
          const directionX = (e.clientX - centerX) / totalDistance;
          const directionY = (e.clientY - centerY) / totalDistance;
          
          const baseOffsetX = directionX * offsetMagnitude * 100; // Scale for visibility
          const baseOffsetY = directionY * offsetMagnitude * 100;
          
          // Calculate positions for each layer
          const newLayerPositions = Array(layers).fill(null).map((_, index) => {
            const layerOffset = layerOffsets[index] || layerOffsets[0] || 1;
            return {
              x: baseOffsetX * layerOffset,
              y: baseOffsetY * layerOffset
            };
          });
          
          setLayerPositions(newLayerPositions);
          setPosition(newLayerPositions[0] || { x: 0, y: 0 });
        } else {
          // Traditional mode: simple linear offset
          const offsetX = (e.clientX - centerX) / magnetStrength;
          const offsetY = (e.clientY - centerY) / magnetStrength;
          setPosition({ x: offsetX, y: offsetY });
        }
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        if (enhanced) {
          setLayerPositions(Array(layers).fill({ x: 0, y: 0 }));
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [padding, disabled, magnetStrength, enhanced, sensitivity, velocityFactor, layers, layerOffsets]);

  const transitionStyle = isActive ? activeTransition : inactiveTransition;
  const enhancedTransition = enhanced ? 
    `transform ${isActive ? '0.4' : '0.6'}s ${getEasingCurve()}` : 
    transitionStyle;

  // Enhanced mode: render multiple layers
  if (enhanced && layerPositions.length > 0) {
    return (
      <div
        ref={magnetRef}
        className={wrapperClassName}
        style={{ position: "relative", width: "100%", height: "100%" }}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          const layerIndex = Math.min(index, layerPositions.length - 1);
          const layerPos = layerPositions[layerIndex] || { x: 0, y: 0 };
          const delay = layerDelays[layerIndex] || layerDelays[0] || 0;
          
          return (
            <div
              key={index}
              className={innerClassName}
              style={{
                position: index === 0 ? 'relative' : 'absolute',
                top: index === 0 ? 'auto' : 0,
                left: index === 0 ? 'auto' : 0,
                transform: `translate3d(${layerPos.x}px, ${layerPos.y}px, 0)`,
                transition: `${enhancedTransition}`,
                transitionDelay: `${delay}ms`,
                willChange: "transform",
                width: "100%",
                height: "100%",
                zIndex: layers - index,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  // Traditional mode: single layer
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
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: enhanced ? enhancedTransition : transitionStyle,
          willChange: "transform",
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;