import React, { useEffect, useState } from 'react';
import Odometer from './Odometer';

const getRiskColor = (risk) => {
  if (risk < 30) return 'var(--risk-low)';
  if (risk < 60) return 'var(--risk-mid)';
  return 'var(--risk-high)';
};

const getRiskTier = (risk) => {
  if (risk < 30) return 'Low Risk';
  if (risk < 60) return 'Moderate Risk';
  return 'High Risk';
};

export const RiskGauge = ({ risk }) => {
  const [animatedRisk, setAnimatedRisk] = useState(0);

  // Smooth integer counter animation on mount / value update
  useEffect(() => {
    let start = animatedRisk;
    const end = risk;
    if (start === end) return;

    const duration = 1200; // 1.2s smooth count
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + easedProgress * (end - start));
      setAnimatedRisk(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [risk]);

  // SVG parameters
  const size = 200;
  const strokeWidth = 8;
  const radius = 80;
  const center = size / 2;
  
  // Arc Math
  // A 270 degree circle with a 90 degree gap at bottom
  // Start angle: 135 degrees (bottom left)
  // End angle: 405 degrees (bottom right)
  const startAngle = 135;
  const totalAngle = 270;
  const circumference = 2 * Math.PI * radius;
  
  // Dash offset calculations
  const fillPercentage = animatedRisk / 100;
  const strokeDasharray = `${circumference * (totalAngle / 360)} ${circumference}`;
  const strokeDashoffset = (circumference * (totalAngle / 360)) * (1 - fillPercentage);

  // Calculate coordinates of the leading edge point
  const currentAngle = startAngle + fillPercentage * totalAngle;
  const rad = (currentAngle * Math.PI) / 180;
  const leadingX = center + radius * Math.cos(rad);
  const leadingY = center + radius * Math.sin(rad);

  const activeColor = getRiskColor(animatedRisk);
  const tier = getRiskTier(animatedRisk);

  return (
    <div className="flex flex-col items-center select-none">
      {/* 270-degree Gauge Canvas */}
      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-0"
        >
          <defs>
            {/* Soft glow filter for leading edge */}
            <filter id="leadingGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Path (gray base) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="origin-center rotate-[135deg]"
          />

          {/* Trailing Glow Arc 2 (Widest, ghost, most offset) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={20}
            strokeOpacity={0.1}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={Math.min(parseFloat(circumference), parseFloat(strokeDashoffset) + 24)}
            strokeLinecap="round"
            className="origin-center rotate-[135deg] transition-all duration-300 ease-out"
          />

          {/* Trailing Glow Arc 1 (Wider, soft, medium offset) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={12}
            strokeOpacity={0.3}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={Math.min(parseFloat(circumference), parseFloat(strokeDashoffset) + 12)}
            strokeLinecap="round"
            className="origin-center rotate-[135deg] transition-all duration-300 ease-out"
          />

          {/* Active Highlight Path */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="origin-center rotate-[135deg] transition-all duration-300 ease-out"
          />

          {/* Glowing Leading Edge Dot */}
          {animatedRisk > 0 && (
            <g filter="url(#leadingGlow)">
              <circle
                cx={leadingX}
                cy={leadingY}
                r="6"
                fill={activeColor}
                className="transition-all duration-300 ease-out"
              />
              <circle
                cx={leadingX}
                cy={leadingY}
                r="2"
                fill="#FFF"
                className="transition-all duration-300 ease-out"
              />
            </g>
          )}
        </svg>

        {/* Text readout centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="font-mono text-5xl font-semibold text-[var(--text-1)] tracking-tighter">
            <Odometer value={animatedRisk} />
            <span className="text-xl text-[var(--text-3)] font-inter font-normal ml-0.5">%</span>
          </span>
          <span 
            className="text-[11px] font-inter font-semibold uppercase tracking-wider mt-1 transition-colors duration-300"
            style={{ color: activeColor }}
          >
            {tier}
          </span>
        </div>
      </div>

      <div className="text-[12px] font-inter text-[var(--text-2)] text-center max-w-[280px] mt-2">
        Metabolic dysfunction probability score calibrated against Pima regression coefficients.
      </div>
    </div>
  );
};

export default RiskGauge;
