import React, { useEffect, useRef, useState, useMemo } from 'react';

export const WavyTicker = ({ 
  items = [], 
  speed = 40, 
  direction = "left", 
  waveAmplitude = 18, 
  waveFrequency = 0.0035, 
  itemHeight = 50, 
  gap = 24, 
  padding = 30 
}) => {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Animation Loop
  useEffect(() => {
    let animId;
    const tick = () => {
      const activeSpeed = isHovered ? speed * 0.25 : speed;
      setOffset((prev) => prev + activeSpeed * 0.016);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [speed, isHovered]);

  const itemSizeEstimate = 220; // Estimated width per item
  const totalWidth = items.length * (itemSizeEstimate + gap);
  const viewportWidth = containerWidth || 1200;
  const repeats = Math.max(4, Math.ceil(viewportWidth / (totalWidth || 1)) + 2);

  const allItems = useMemo(() => {
    return Array.from({ length: repeats }, () => items).flat();
  }, [repeats, items]);

  const loopLength = totalWidth || 1;
  const wrappedOffset = (offset % loopLength + loopLength) % loopLength;
  const finalOffset = direction === "left" ? -wrappedOffset : wrappedOffset - loopLength;

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden select-none py-10"
      style={{
        height: `${itemHeight + waveAmplitude * 2 + padding * 2}px`,
        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex absolute"
        style={{
          gap: `${gap}px`,
          transform: `translateX(${finalOffset}px)`,
          willChange: 'transform',
        }}
      >
        {allItems.map((item, idx) => {
          const position = idx * (itemSizeEstimate + gap);
          const waveY = Math.sin((position + offset * 8) * waveFrequency) * waveAmplitude;
          return (
            <div
              key={idx}
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: `${itemSizeEstimate}px`,
                height: `${itemHeight}px`,
                transform: `translateY(${waveY}px)`,
                willChange: 'transform',
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WavyTicker;
