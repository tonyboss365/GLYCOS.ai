import React, { useEffect, useRef } from 'react';

export const DotCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize 80 dots in a grid (e.g., 10 cols x 8 rows)
    const cols = 10;
    const rows = 8;
    const numDots = cols * rows; // Exactly 80
    const dots = [];

    const initDots = () => {
      dots.length = 0;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Base grid positions centered in cells
          const anchorX = c * cellW + cellW / 2;
          const anchorY = r * cellH + cellH / 2;
          dots.push({
            anchorX,
            anchorY,
            x: anchorX,
            y: anchorY,
            // Drift config
            phaseX: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            speedX: 0.0008 + Math.random() * 0.001,
            speedY: 0.0008 + Math.random() * 0.001,
            // Lerped current positions
            repelX: 0,
            repelY: 0,
          });
        }
      }
    };

    initDots();

    const handleResize = () => {
      initDots();
    };

    const handleMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = {
        x: -1000,
        y: -1000,
      };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = (timestamp) => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update positions
      dots.forEach((dot) => {
        // Drift calculations (drift ±15px)
        const dx = Math.sin(timestamp * dot.speedX + dot.phaseX) * 15;
        const dy = Math.cos(timestamp * dot.speedY + dot.phaseY) * 15;

        // Base coordinate with drift
        const driftedX = dot.anchorX + dx;
        const driftedY = dot.anchorY + dy;

        // Repel calculations from mouse
        const toMouseX = driftedX - mx;
        const toMouseY = driftedY - my;
        const dist = Math.hypot(toMouseX, toMouseY);

        let targetRepelX = 0;
        let targetRepelY = 0;

        if (dist < 150) {
          const force = (150 - dist) / 150; // 0 to 1
          const pushForce = force * 35; // Maximum repel distance in pixels
          
          // Vector direction away from mouse
          if (dist > 0.1) {
            targetRepelX = (toMouseX / dist) * pushForce;
            targetRepelY = (toMouseY / dist) * pushForce;
          }
        }

        // Smoothly interpolate repel offsets (lerp)
        dot.repelX += (targetRepelX - dot.repelX) * 0.1;
        dot.repelY += (targetRepelY - dot.repelY) * 0.1;

        // Final positions
        dot.x = driftedX + dot.repelX;
        dot.y = driftedY + dot.repelY;
      });

      // Draw connections: each dot to its nearest 3 neighbors
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;

      for (let i = 0; i < dots.length; i++) {
        const d1 = dots[i];
        // Calculate distances to all other dots
        const distances = [];
        for (let j = 0; j < dots.length; j++) {
          if (i === j) continue;
          const dist = Math.hypot(dots[j].x - d1.x, dots[j].y - d1.y);
          distances.push({ index: j, dist });
        }

        // Sort by distance and grab top 3
        distances.sort((a, b) => a.dist - b.dist);
        const nearest = distances.slice(0, 3);

        nearest.forEach((n) => {
          ctx.beginPath();
          ctx.moveTo(d1.x, d1.y);
          ctx.lineTo(dots[n.index].x, dots[n.index].y);
          ctx.stroke();
        });
      }

      // Draw dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block"
      style={{ zIndex: 0 }}
    />
  );
};

export default DotCanvas;
