import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Odometer from './Odometer';

// Danger threshold check
const isDangerZone = (key, value) => {
  switch (key) {
    case 'glucose': return value > 140;
    case 'bmi': return value >= 30.0;
    case 'age': return value >= 45;
    case 'bloodPressure': return value > 80;
    case 'insulin': return value > 166;
    case 'skinThickness': return value > 40;
    case 'pregnancies': return value > 5;
    case 'diabetesPedigree': return value > 0.8;
    default: return false;
  }
};

export const MetricSlider = ({
  metricKey,
  label,
  min,
  max,
  step,
  value,
  unit = '',
  normalRange,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const trackRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing]);

  const updateFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newVal = min + pct * (max - min);

    // Apply step snapping
    const stepPrecision = step.toString().split('.')[1]?.length || 0;
    const stepsCount = Math.round((newVal - min) / step);
    let snappedVal = min + stepsCount * step;
    
    // Clamp values
    snappedVal = Math.max(min, Math.min(max, parseFloat(snappedVal.toFixed(stepPrecision))));
    onChange(snappedVal);
  };

  const handlePointerDown = (e) => {
    // If user clicked input, don't drag
    if (e.target.tagName === 'INPUT') return;
    e.preventDefault();
    updateFromClientX(e.clientX);
    
    const handlePointerMove = (moveEvent) => {
      updateFromClientX(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleTextSubmit = () => {
    setIsEditing(false);
    let num = parseFloat(editValue);
    if (isNaN(num)) {
      setEditValue(value.toString());
      return;
    }
    if (num < min) num = min;
    if (num > max) num = max;

    const stepPrecision = step.toString().split('.')[1]?.length || 0;
    num = parseFloat(num.toFixed(stepPrecision));
    onChange(num);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleTextSubmit();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  const isDanger = isDangerZone(metricKey, value);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      className="slider-row-track w-full py-5 flex items-center justify-between relative overflow-hidden select-none cursor-pointer border-b border-[var(--border-soft)] group"
    >
      {/* Left: Metric Name */}
      <span className="font-syne font-bold text-xl md:text-2xl text-[var(--text-1)] tracking-tight pr-4">
        {label}
      </span>

      {/* Center: Naked 1px Line Track */}
      <div className="flex-1 h-[1px] bg-[var(--border-soft)] relative mx-4 md:mx-8 pointer-events-none">
        <div 
          className="absolute left-0 top-0 h-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: isDanger ? 'var(--risk-high)' : 'var(--cyan-accent)'
          }}
        />
        {/* Sliding dot indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[var(--void)] transition-all duration-300"
          style={{ 
            left: `${percentage}%`,
            backgroundColor: isDanger ? 'var(--risk-high)' : 'var(--cyan-accent)',
            boxShadow: isDanger ? '0 0 8px var(--risk-high)' : '0 0 8px var(--cyan-accent)'
          }}
        />
      </div>

      {/* Right: Interactive Value & Units */}
      <div className="flex items-center gap-3 pl-4 pointer-events-auto">
        {isEditing ? (
          <input
            ref={textInputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={handleKeyDown}
            step={step}
            className="w-16 text-right font-mono text-xl md:text-2xl bg-transparent text-[var(--text-1)] border-b border-[var(--cyan-accent)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="font-mono text-xl md:text-2xl text-[var(--text-1)] hover:text-[var(--cyan-accent)] transition-colors duration-200 cursor-pointer font-medium"
          >
            <Odometer value={value} />
          </span>
        )}
        <div className="flex flex-col items-end justify-center leading-none text-left select-none pointer-events-none">
          <span className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-wider">
            {unit || 'Score'}
          </span>
          <span className="font-mono text-[7px] text-[var(--text-4)] mt-0.5">
            ({normalRange})
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricSlider;
