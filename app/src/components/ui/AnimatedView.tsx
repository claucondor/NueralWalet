import React, { useState, useEffect } from "react";

interface AnimatedViewProps {
  show: boolean;
  children: React.ReactNode;
  direction?: "right" | "left" | "up" | "down";
}

/**
 * Componente para transiciones animadas entre vistas
 * 
 * @param show - Si se muestra la vista
 * @param children - Contenido a mostrar
 * @param direction - Dirección de la animación (right, left, up, down)
 */
const AnimatedView: React.FC<AnimatedViewProps> = ({ 
  show, 
  children, 
  direction = "right" 
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (show) {
      setMounted(true);
    }
    
    // Si la vista se oculta, esperamos a que termine la transición antes de desmontar
    if (!show && mounted) {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 700); // Increased to 700ms to match the new animation duration
      return () => clearTimeout(timer);
    }
  }, [show, mounted]);
  
  if (!show && !mounted) return null;
  
  // Determinar las clases de animación según la dirección
  let translateClass = "translate-x-full opacity-0";
  let translateActiveClass = "translate-x-0 opacity-100";
  
  if (direction === "left") {
    translateClass = "-translate-x-full opacity-0";
    translateActiveClass = "translate-x-0 opacity-100";
  } else if (direction === "up") {
    translateClass = "translate-y-full opacity-0";
    translateActiveClass = "translate-y-0 opacity-100";
  } else if (direction === "down") {
    translateClass = "-translate-y-full opacity-0";
    translateActiveClass = "translate-y-0 opacity-100";
  }
  
  return (
    <div 
      className={`fixed inset-0 z-40 bg-gray-100/80 backdrop-blur-sm transition-all duration-700 ease-out ${
        show ? "opacity-100 pointer-events-auto animate-fade-in-up" : "opacity-0 pointer-events-none animate-fade-out-down"
      }`}
      style={{
        perspective: '1000px',
        height: 'calc(var(--vh, 1vh) * 100)'
      }}
    >
      <div 
        className={`fixed inset-0 flex items-center justify-center overflow-hidden`}
        style={{
          height: 'calc(var(--vh, 1vh) * 100)'
        }}
      >
        <div 
          className={`relative w-full max-w-md h-85vh-real bg-white flex flex-col overflow-hidden rounded-xl shadow-xl transition-all duration-700 ease-out transform ${show ? `${translateActiveClass} animate-spring-in-${direction}` : `${translateClass} animate-spring-out-${direction}`}`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            boxShadow: show ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 0 0 rgba(0, 0, 0, 0)',
            animation: show ? 'pulse-shadow 2s ease-in-out infinite' : 'none'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnimatedView;