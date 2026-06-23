import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Diagnosis from './pages/Diagnosis';
import Loader from './components/Loader';
import Scene3D from './components/Scene3D';
import DiagnosisScene3D from './components/DiagnosisScene3D';
import { audio } from './model/audio';
import BloopTransition from './components/BloopTransition';
import PixelRevealTransition from './components/PixelRevealTransition';

// Register GSAP plugins globally
gsap.registerPlugin(ScrollTrigger);

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('.interactive-element') ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.slider-row-track')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);

    // Hide default cursor
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    let animId;
    const updateTrail = () => {
      setTrail((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        };
      });
      animId = requestAnimationFrame(updateTrail);
    };
    animId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animId);
  }, [position, visible]);

  if (!visible) return null;

  return (
    <>
      {/* Inner Dot */}
      <div
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full bg-[var(--text-1)] pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${hovered ? 1.5 : 1})`,
        }}
      />
      {/* Outer Ring */}
      <div
        className="fixed top-0 left-0 w-9 h-9 rounded-full border border-[var(--text-1)] opacity-30 pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out"
        style={{
          left: `${trail.x}px`,
          top: `${trail.y}px`,
          transform: `translate(-50%, -50%) scale(${hovered ? 1.8 : 1})`,
          backgroundColor: hovered ? 'rgba(56, 128, 135, 0.04)' : 'transparent',
        }}
      />
    </>
  );
};

export const App = () => {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' or 'diagnosis'
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1);
  const [navTransitionType, setNavTransitionType] = useState(null); // 'bloop' or 'pixel'
  const [pendingPage, setPendingPage] = useState(null);

  // Initialize Lenis smooth scroll and link to GSAP ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExponential
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickHandler = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickHandler);
    gsap.ticker.lagSmoothing(0);

    // Save Lenis instance to window for global access
    window.lenis = lenis;

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickHandler);
      window.lenis = null;
    };
  }, []);

  // Initialize and play ambient sound once loader completes
  useEffect(() => {
    if (!loaderComplete) return;

    const initAudio = () => {
      audio.init();
      // Ensure mute state matches React state
      if (audio.isMuted !== isMuted) {
        audio.isMuted = isMuted;
        if (audio.masterGain) {
          audio.masterGain.gain.setValueAtTime(isMuted ? 0 : 0.08, audio.ctx.currentTime);
        }
      }
      window.removeEventListener('click', initAudio);
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };

    // Try initializing immediately (gesture might have already occurred)
    initAudio();

    // Fallback listeners for first interaction
    window.addEventListener('click', initAudio);
    window.addEventListener('pointerdown', initAudio);
    window.addEventListener('keydown', initAudio);

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [loaderComplete, isMuted]);

  const handleNavigate = (page) => {
    if (page === currentPage) return;
    audio.playClick();
    setPendingPage(page);
    if (page === 'diagnosis') {
      setNavTransitionType('pixel');
    } else {
      setNavTransitionType('bloop');
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--void)] text-[var(--text-1)] relative transition-colors duration-500 ${currentPage === 'diagnosis' ? 'light-clinical' : ''}`}>
      <CustomCursor />
      {/* Bloop Transition Overlay */}
      <BloopTransition
        isActive={navTransitionType === 'bloop'}
        onTransitionHalfway={() => {
          if (pendingPage) {
            setCurrentPage(pendingPage);
            setTimeout(() => {
              if (window.lenis) {
                window.lenis.scrollTo(0, { immediate: true });
              }
              ScrollTrigger.refresh();
            }, 30);
          }
        }}
        onTransitionComplete={() => {
          setNavTransitionType(null);
          setPendingPage(null);
        }}
      />

      {/* Pixel Reveal Transition Overlay */}
      <PixelRevealTransition
        isActive={navTransitionType === 'pixel'}
        onTransitionHalfway={() => {
          if (pendingPage) {
            setCurrentPage(pendingPage);
            setTimeout(() => {
              if (window.lenis) {
                window.lenis.scrollTo(0, { immediate: true });
              }
              ScrollTrigger.refresh();
            }, 30);
          }
        }}
        onTransitionComplete={() => {
          setNavTransitionType(null);
          setPendingPage(null);
        }}
      />

      {/* Cinematic Branded Loader (unmounts after 5s timeline completion) */}
      {!loaderComplete && <Loader onComplete={() => setLoaderComplete(true)} />}

      {/* 3D WebGL Canvas Backdrop Scene (only on Landing page) */}
      {currentPage === 'landing' && <Scene3D loaderComplete={loaderComplete} />}
      {currentPage === 'diagnosis' && <DiagnosisScene3D currentQuestionIndex={currentQuestionIdx} />}

      {/* Navigation Header */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Smooth Page transition container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.8, 0, 0.1, 1] }}
          className="w-full min-h-screen relative z-10"
        >
          {currentPage === 'landing' ? (
            <Landing onNavigate={handleNavigate} loaderComplete={loaderComplete} />
          ) : (
            <Diagnosis onQuestionIndexChange={setCurrentQuestionIdx} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Speaker Mute Toggle */}
      {loaderComplete && (
        <button
          onClick={() => {
            const muted = audio.toggleMute();
            setIsMuted(muted);
          }}
          className="fixed bottom-6 right-6 w-9 h-9 rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] backdrop-blur-[8px] flex items-center justify-center text-[var(--text-1)] hover:border-[var(--text-1)] hover:text-[var(--text-1)] transition-all duration-300 z-[999]"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          )}
        </button>
      )}
    </div>
  );
};

export default App;
