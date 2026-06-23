import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export const BloopTransition = ({ isActive, onTransitionHalfway, onTransitionComplete }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      const run = async () => {
        // Step 1: scale from center and morph border-radius to cover the entire screen
        await controls.start({
          scale: 3.5,
          borderRadius: "0%",
          width: "100vmax",
          height: "100vmax",
          transition: {
            duration: 0.75,
            ease: [0.76, 0, 0.24, 1] // Easing matches the Framer Bloop Preloader
          }
        });

        // Trigger page change at halfway point when screen is fully covered
        if (onTransitionHalfway) onTransitionHalfway();

        // Brief delay before starting release animation
        await new Promise(resolve => setTimeout(resolve, 150));

        // Step 2: shrink and fade out wobbly droplet
        await controls.start({
          opacity: 0,
          scale: 0,
          transition: {
            duration: 0.65,
            ease: [0.76, 0, 0.24, 1]
          }
        });

        if (onTransitionComplete) onTransitionComplete();
      };
      run();
    } else {
      controls.set({
        scale: 0,
        opacity: 1,
        borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%", // wobbly organic droplet shape
        width: "50vmax",
        height: "50vmax"
      });
    }
  }, [isActive, controls]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-none">
      <motion.div
        animate={controls}
        initial={{
          scale: 0,
          opacity: 1,
          borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
          width: "50vmax",
          height: "50vmax"
        }}
        className="bg-[#388087] shadow-[0_0_100px_rgba(56,128,135,0.35)] pointer-events-auto"
        style={{
          transformOrigin: 'center center'
        }}
      />
    </div>
  );
};

export default BloopTransition;
