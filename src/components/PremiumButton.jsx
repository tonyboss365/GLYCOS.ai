import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export const PremiumButton = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const buttonRef = useRef(null);
  const textRef = useRef(null);
  const fillRef = useRef(null);

  useEffect(() => {
    const btn = buttonRef.current;
    const text = textRef.current;
    const fill = fillRef.current;
    if (!btn || !text || !fill || disabled) return;

    // QuickTo vectors for high-performance 60fps text magnetism
    const xToText = gsap.quickTo(text, 'x', { duration: 0.4, ease: 'power3.out' });
    const yToText = gsap.quickTo(text, 'y', { duration: 0.4, ease: 'power3.out' });

    const handleMouseEnter = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Pivot fill expansion at pointer collision coordinates
      gsap.set(fill, { top: y, left: x, scale: 0 });
      gsap.to(fill, { scale: 1, duration: 0.5, ease: 'power3.out' });
    };

    const handleMouseLeave = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Pivot exit collapse at pointer exit coordinates
      gsap.to(fill, { top: y, left: x, scale: 0, duration: 0.5, ease: 'power3.out' });
      
      // Snap text alignment back to center
      xToText(0);
      yToText(0);
    };

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Translate text slightly towards cursor (20% boundary constraint)
      xToText(dx * 0.2);
      yToText(dy * 0.2);
    };

    btn.addEventListener('mouseenter', handleMouseEnter);
    btn.addEventListener('mouseleave', handleMouseLeave);
    btn.addEventListener('mousemove', handleMouseMove);

    return () => {
      btn.removeEventListener('mouseenter', handleMouseEnter);
      btn.removeEventListener('mouseleave', handleMouseLeave);
      btn.removeEventListener('mousemove', handleMouseMove);
    };
  }, [disabled]);

  const baseStyle = "relative overflow-hidden rounded-none font-inter font-semibold text-sm flex items-center justify-center gap-2 group z-50 interactive-element transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[var(--surface-1)] border border-[var(--text-1)] text-[var(--text-1)]",
    secondary: "bg-[var(--surface-1)] border border-[var(--border-mid)] text-[var(--text-1)] hover:border-[var(--text-1)]",
    nav: "bg-transparent border border-[var(--text-1)] text-[var(--text-1)] text-xs px-5 py-2",
    cyan: "bg-[var(--surface-1)] border border-[var(--cyan-accent)] text-[var(--cyan-accent)]"
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Expanding Liquid Fill Background */}
      <span
        ref={fillRef}
        className={`absolute w-[150%] aspect-square rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0 scale-0 ${
          variant === 'cyan' 
            ? 'bg-[var(--cyan-accent)]' 
            : variant === 'secondary' 
              ? 'bg-[var(--border-soft)]' 
              : 'bg-[var(--text-1)]'
        }`}
      />
      
      {/* Content wrapper */}
      <span
        ref={textRef}
        className={`relative z-10 flex items-center gap-2 transition-colors duration-300 pointer-events-none ${
          variant === 'secondary' ? '' : 'group-hover:text-[var(--void)]'
        }`}
      >
        {children}
      </span>
    </button>
  );
};

export default PremiumButton;
