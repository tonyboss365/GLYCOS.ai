import React, { useEffect, useRef, useState } from 'react';

export const MorphingOrbs = () => {
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Scale mouse position to minor movement offsets (max 40px translation)
      const xOffset = (e.clientX / window.innerWidth - 0.5) * 45;
      const yOffset = (e.clientY / window.innerHeight - 0.5) * 45;
      setMouseOffset({ x: xOffset, y: yOffset });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 opacity-20"
      style={{ filter: 'blur(110px)' }}
    >
      {/* Orb 1 - Cyan/Blue */}
      <div 
        className="absolute w-[45vw] h-[45vw] rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 animate-orb-1"
        style={{
          top: '10%',
          left: '15%',
          transform: `translate3d(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px, 0)`,
          transition: 'transform 1.2s cubic-bezier(0.1, 0.8, 0.2, 1)',
        }}
      />

      {/* Orb 2 - Deep Violet */}
      <div 
        className="absolute w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-purple-800 to-blue-800 animate-orb-2"
        style={{
          bottom: '15%',
          right: '10%',
          transform: `translate3d(${-mouseOffset.x * 1.2}px, ${-mouseOffset.y * 1.2}px, 0)`,
          transition: 'transform 1.5s cubic-bezier(0.1, 0.8, 0.2, 1)',
        }}
      />

      {/* Orb 3 - Dark Indigo */}
      <div 
        className="absolute w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-indigo-900 to-purple-900 animate-orb-3"
        style={{
          top: '40%',
          left: '50%',
          transform: `translate3d(${mouseOffset.x * 0.5}px, ${-mouseOffset.y * 0.5}px, 0)`,
          transition: 'transform 1.8s cubic-bezier(0.1, 0.8, 0.2, 1)',
        }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orb1 {
          0% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; }
          33% { border-radius: 50% 50% 50% 50% / 40% 60% 40% 60%; transform: scale(1.1) translate(20px, -20px); }
          66% { border-radius: 60% 40% 40% 60% / 60% 40% 60% 40%; transform: scale(0.95) translate(-20px, 20px); }
          100% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; }
        }
        @keyframes orb2 {
          0% { border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%; }
          33% { border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%; transform: scale(0.9) translate(-30px, 15px); }
          66% { border-radius: 50% 50% 60% 40% / 40% 50% 50% 50%; transform: scale(1.05) translate(30px, -15px); }
          100% { border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%; }
        }
        @keyframes orb3 {
          0% { border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%; }
          33% { border-radius: 60% 40% 60% 40% / 50% 50% 50% 50%; transform: scale(1.05) translate(15px, 20px); }
          66% { border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%; transform: scale(0.9) translate(-15px, -20px); }
          100% { border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%; }
        }
        .animate-orb-1 {
          animation: orb1 16s ease-in-out infinite;
          will-change: transform, filter;
        }
        .animate-orb-2 {
          animation: orb2 20s ease-in-out infinite;
          will-change: transform, filter;
        }
        .animate-orb-3 {
          animation: orb3 18s ease-in-out infinite;
          will-change: transform, filter;
        }
      `}} />
    </div>
  );
};

export default MorphingOrbs;
