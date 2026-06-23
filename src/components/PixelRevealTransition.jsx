import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

function getDelay(r, c, ROWS, COLS, pattern, speed) {
  const maxDist = Math.sqrt((ROWS - 1) ** 2 + (COLS - 1) ** 2);
  let dist = 0;
  switch (pattern) {
    case "center":
      dist = Math.sqrt((r - ROWS / 2) ** 2 + (c - COLS / 2) ** 2);
      break;
    case "topLeft":
      dist = Math.sqrt(r * r + c * c);
      break;
    case "random":
      dist = Math.random() * maxDist;
      break;
    case "leftToRight":
      dist = c;
      break;
    default:
      dist = Math.sqrt(r * r + c * c);
  }
  return (dist / maxDist) * speed;
}

export const PixelRevealTransition = ({ isActive, onTransitionHalfway, onTransitionComplete }) => {
  const controls = useAnimation();
  const [shouldRender, setShouldRender] = useState(false);

  const rows = 12;
  const cols = 16;
  const pixelColor = "#388087"; // Deep Teal
  const speed = 0.55;
  const pattern = "center";

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      const run = async () => {
        // Step 1: Pixel grid reveals (fades in)
        controls.set({ opacity: 0 });
        await controls.start(i => ({
          opacity: 1,
          transition: { delay: i.delay, duration: 0.08, ease: "easeOut" }
        }));

        // Halfway point: page content changes under the covered screen
        if (onTransitionHalfway) onTransitionHalfway();

        // Brief hold
        await new Promise(resolve => setTimeout(resolve, 150));

        // Step 2: Pixel grid disappears (fades out)
        await controls.start(i => ({
          opacity: 0,
          transition: { delay: (speed - i.delay) * 0.7, duration: 0.08, ease: "easeIn" }
        }));

        setShouldRender(false);
        if (onTransitionComplete) onTransitionComplete();
      };
      run();
    }
  }, [isActive, controls]);

  if (!shouldRender) return null;

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const delay = getDelay(r, c, rows, cols, pattern, speed);
      cells.push(
        <motion.div
          key={`${r}-${c}`}
          custom={{ delay }}
          initial={{ opacity: 0 }}
          animate={controls}
          style={{
            position: "absolute",
            left: `${(c / cols) * 100}%`,
            top: `${(r / rows) * 100}%`,
            width: `calc(${100 / cols}% + 1px)`,
            height: `calc(${100 / rows}% + 1px)`,
            backgroundColor: pixelColor,
            pointerEvents: "none"
          }}
        />
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] pointer-events-none w-full h-full overflow-hidden">
      {cells}
    </div>
  );
};

export default PixelRevealTransition;
