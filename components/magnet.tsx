import React, { useState, useEffect, useRef, ReactNode, HTMLAttributes } from "react";

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 3,
  activeTransition = "transform 0.8s ease-in-out",
  inactiveTransition = "transform 0.8s linear(0,.5737 7.6%,.8382 11.87%,.9463 14.19%,1.0292 16.54%,1.0886 18.97%,1.1258 21.53%,1.137 22.97%,1.1424 24.48%,1.1423 26.1%,1.1366 27.86%,1.1165 31.01%,1.0507 38.62%,1.0219 42.57%,.9995 46.99%,.9872 51.63%,.9842 58.77%,1.0011 81.26%,1)",
  wrapperClassName = "",
  innerClassName = "",
  ...props
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        const offsetX = (e.clientX - centerX) / magnetStrength;
        const offsetY = (e.clientY - centerY) / magnetStrength;
        setPosition({ x: offsetX, y: offsetY });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [padding, disabled, magnetStrength]);

  const transitionStyle = isActive ? activeTransition : inactiveTransition;
  const rotationAngle = isActive ? (position.x / 10) : 0;

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
          transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${rotationAngle}deg)`,
          transition: transitionStyle,
          willChange: "transform",
          width: "100%",
          height: "100%",
          filter: isActive ? "drop-shadow(0 20px 40px rgb(255, 255, 255))" : "none",
          
          borderRadius: isActive ? "2xl" : "0",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;