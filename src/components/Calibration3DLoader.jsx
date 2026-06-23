import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Calibration3DLoader = ({ progress }) => {
  const pct = progress / 100;

  // Synced progress color lerping from Deep Teal (#388087) to Terracotta (#D96846)
  const activeColor = useMemo(() => {
    const startHex = '388087';
    const endHex = 'D96846';
    
    const r1 = parseInt(startHex.slice(0, 2), 16);
    const g1 = parseInt(startHex.slice(2, 4), 16);
    const b1 = parseInt(startHex.slice(4, 6), 16);

    const r2 = parseInt(endHex.slice(0, 2), 16);
    const g2 = parseInt(endHex.slice(2, 4), 16);
    const b2 = parseInt(endHex.slice(4, 6), 16);

    const r = Math.round(r1 + (r2 - r1) * pct);
    const g = Math.round(g1 + (g2 - g1) * pct);
    const b = Math.round(b1 + (b2 - b1) * pct);

    return `rgb(${r}, ${g}, ${b})`;
  }, [pct]);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 md:p-16 select-none z-10">
      
      {/* Top Block: Brand Name & Solved state */}
      <div className="w-full flex justify-between items-start">
        <div className="flex flex-col gap-1 text-left">
          <motion.span 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-syne font-bold text-2xl uppercase tracking-widest text-[#F6F6F2]"
          >
            GLYCOS //
          </motion.span>
          <span className="font-mono text-[9px] text-white/40 tracking-widest uppercase">
            CALIBRATION PROTOCOL V2
          </span>
        </div>
        <div className="font-mono text-[9px] text-[#D96846] border border-[#D96846]/20 px-3 py-1.5 bg-white/5 tracking-[0.25em] uppercase">
          [ ACTIVE ]
        </div>
      </div>

      {/* Middle Block: Synced Progress Line (Framer-style) */}
      <div className="w-full my-auto flex flex-col gap-4">
        <div className="w-full h-[3px] bg-white/5 relative overflow-hidden">
          <motion.div 
            className="h-full absolute left-0 top-0 transition-all duration-100 ease-out"
            style={{ 
              width: `${progress}%`,
              backgroundColor: activeColor,
              boxShadow: `0 0 16px ${activeColor}`
            }}
          />
        </div>
        <div className="flex justify-between items-center font-mono text-[9px] text-white/40 uppercase tracking-widest">
          <span>Processing Metabolic Weights</span>
          <span style={{ color: activeColor }}>{progress}%</span>
        </div>
      </div>

      {/* Bottom Block: Step Logs (Left) & Giant Counter (Right) */}
      <div className="w-full flex flex-col md:flex-row justify-between items-end gap-6">
        
        {/* Step progression logs */}
        <div className="flex flex-col gap-2 text-left font-mono text-[9px] text-white/35 max-w-sm w-full">
          <div className="font-bold text-white/50 tracking-wider mb-1 uppercase">
            [ STEP PROGRESSION ]
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${progress >= 25 ? 'text-white/60 line-through' : 'text-[#388087] font-semibold'}`}>
            <span>01.</span>
            <span>INITIALIZE COHERENCE MATRIX</span>
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${progress >= 50 ? 'text-white/60 line-through' : progress >= 25 ? 'text-[#388087] font-semibold animate-pulse' : ''}`}>
            <span>02.</span>
            <span>SCALING BIOMARKER WEIGHTS</span>
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${progress >= 75 ? 'text-white/60 line-through' : progress >= 50 ? 'text-[#D96846] font-semibold animate-pulse' : ''}`}>
            <span>03.</span>
            <span>SIGMOID RISK ESTIMATION</span>
          </div>
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${progress >= 100 ? 'text-white/60 line-through' : progress >= 75 ? 'text-[#D96846] font-semibold animate-pulse' : ''}`}>
            <span>04.</span>
            <span>PREDICTION REPORT DISPATCH</span>
          </div>
        </div>

        {/* Giant sliding counter */}
        <div className="flex items-baseline relative select-none h-[clamp(6rem,18vw,20rem)] overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={progress}
              initial={{ y: '65%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-65%', opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="font-syne font-light text-[clamp(6rem,18vw,20rem)] leading-[0.8] tracking-[-0.06em] text-[#F6F6F2] block"
            >
              {progress < 10 ? `0${progress}` : progress}
            </motion.span>
          </AnimatePresence>
          <span className="font-syne font-light text-[0.4em] text-[#F6F6F2] ml-1">%</span>
        </div>
        
      </div>
      
      {/* Soft back aura glow */}
      <div 
        className="absolute inset-0 opacity-[0.03] transition-colors duration-500 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at center, ${activeColor} 0%, transparent 65%)`
        }}
      />
    </div>
  );
};

export default Calibration3DLoader;
