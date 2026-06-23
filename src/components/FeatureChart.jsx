import React from 'react';
import { motion } from 'framer-motion';

export const FeatureChart = ({ contributions }) => {
  // Find maximum absolute value to scale bars relative to each other
  const maxVal = Math.max(
    ...contributions.map((c) => Math.abs(c.value)),
    0.01 // Avoid division by zero
  );

  return (
    <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-6 select-none bg-[var(--surface-1)] shadow-sm">
      <div>
        <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-[var(--text-1)]">
          Biomarker Contribution Weight
        </h3>
        <p className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-wider mt-1">
          Protective factors (&minus;) vs. Risk contributors (+) scaled relative to patient profile.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {contributions.map((item, index) => {
          const isRisk = item.value >= 0;
          const pct = (Math.abs(item.value) / maxVal) * 50; // Max width is 50% for each side

          // Format clean labels
          const formattedLabel = item.name.replace(/([A-Z])/g, ' $1');

          return (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider">
                <span className="text-[var(--text-2)]">{formattedLabel}</span>
                <span 
                  className={`font-semibold ${
                    isRisk ? 'text-[var(--risk-high)]' : 'text-[var(--cyan-accent)]'
                  }`}
                >
                  {isRisk ? '+' : ''}{item.value.toFixed(2)}
                </span>
              </div>

              {/* Dual-sided progress track */}
              <div className="w-full h-1.5 bg-[var(--surface-2)] relative flex items-center">
                {/* Center marker line (0 Point) */}
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[var(--border-mid)] z-10" />

                {/* Left Side (Protective) Fill */}
                {!isRisk && (
                  <motion.div
                    initial={{ width: 0, right: '50%' }}
                    animate={{ width: `${pct}%`, right: '50%' }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: index * 0.05 }}
                    className="absolute h-full bg-[var(--cyan-accent)]"
                    style={{ right: '50%' }}
                  />
                )}

                {/* Right Side (Risk) Fill */}
                {isRisk && (
                  <motion.div
                    initial={{ width: 0, left: '50%' }}
                    animate={{ width: `${pct}%`, left: '50%' }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: index * 0.05 }}
                    className="absolute h-full bg-[var(--risk-high)]"
                    style={{ left: '50%' }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[9px] font-mono text-[var(--text-3)] pt-2 border-t border-[rgba(255,255,255,0.03)]">
        <span>&larr; PROTECTIVE</span>
        <span>RISK DRIVERS &rarr;</span>
      </div>
    </div>
  );
};

export default FeatureChart;
