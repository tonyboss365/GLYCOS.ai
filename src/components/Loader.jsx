import React, { useEffect, useState, startTransition } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const Loader = ({ onComplete }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const topControls = useAnimation();
  const bottomControls = useAnimation();

  const logoText = "GLYCOS";
  const backgroundColor = "#F6F6F2"; // Landing page background
  const textColor = "#388087";       // Landing page brand color
  const underlineColor = "#388087";   // Underline color
  const underlineThickness = 2;

  const letters = logoText.split("");
  const letterDelay = 0.08;
  const underlineDelay = letters.length * letterDelay + 0.5;
  const fadeOutDelay = underlineDelay + 0.6 + 0.8;
  const blindsDelay = fadeOutDelay + 0.3;

  useEffect(() => {
    const runAnimation = async () => {
      // Wait for all text animations to finish, then split blinds
      await new Promise(resolve => setTimeout(resolve, blindsDelay * 1000));
      
      // Animate blinds opening from center vertically
      await Promise.all([
        topControls.start({
          y: "-100%",
          transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] }
        }),
        bottomControls.start({
          y: "100%",
          transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] }
        })
      ]);

      startTransition(() => {
        // Completely remove from DOM after a brief delay
        setTimeout(() => {
          setShouldRender(false);
          if (onComplete) onComplete();
        }, 100);
      });
    };

    runAnimation();
  }, [topControls, bottomControls, onComplete]);

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 w-full h-full select-none" 
      style={{ zIndex: 10000, pointerEvents: 'none' }}
    >
      {/* Top half block */}
      <motion.div
        animate={topControls}
        initial={{ y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "50%",
          backgroundColor,
          pointerEvents: "auto"
        }}
      />
      
      {/* Bottom half block */}
      <motion.div
        animate={bottomControls}
        initial={{ y: 0 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "50%",
          backgroundColor,
          pointerEvents: "auto"
        }}
      />

      {/* Centered logo text and underline */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: fadeOutDelay, duration: 0.3, ease: "easeIn" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-5"
        style={{ zIndex: 10001, pointerEvents: "none" }}
      >
        {/* Letters container */}
        <div className="flex font-syne font-extrabold text-[clamp(2.5rem,6vw,5.5rem)] tracking-[0.25em] text-[#388087]">
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * letterDelay, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ display: "inline-block" }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Separator underline */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: underlineDelay, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          style={{
            height: underlineThickness,
            backgroundColor: underlineColor
          }}
        />
      </motion.div>
    </div>
  );
};

export default Loader;
