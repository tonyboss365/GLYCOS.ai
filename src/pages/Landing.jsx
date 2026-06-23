import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import WavyTicker from '../components/WavyTicker';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Custom digit scramble counting component
const ScrambleNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [isComplete, setIsComplete] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime = null;
          const duration = 800; // 800ms total scramble

          const run = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            if (progress < 1) {
              const scrambled = value.split('').map(char => {
                if (/[0-9]/.test(char)) {
                  return Math.floor(Math.random() * 10).toString();
                }
                return char;
              }).join('');
              setDisplayValue(scrambled);
              requestAnimationFrame(run);
            } else {
              setDisplayValue(value);
              setIsComplete(true);
            }
          };

          requestAnimationFrame(run);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="inline-block">
      {displayValue}
    </span>
  );
};

export const Landing = ({ onNavigate, loaderComplete = true }) => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const tickerItems = [
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t1">
      ACCURACY: 77.3%
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t2">
      PIMA INDIANS COHORT
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t3">
      GLUCOSE COHERENCE
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t4">
      INSULIN RESPONSE
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t5">
      AGE FACTOR ANALYSIS
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t6">
      DIABETIC PEDIGREE
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t7">
      BLOOD PRESSURE INDEX
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t8">
      BODY MASS INDEX (BMI)
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t9">
      LOGISTIC REGRESSION CLASSIFIER
    </div>,
    <div className="px-5 py-2.5 border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-1)] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shadow-sm" key="t10">
      REAL-TIME METRIC INTERPOLATION
    </div>
  ];

  React.useLayoutEffect(() => {
    if (!loaderComplete) {
      gsap.set(heroRef.current, { opacity: 0 });
      gsap.set('.hero-title', { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', y: 35 });
      gsap.set('.hero-sub', { opacity: 0, y: 20 });
      gsap.set('.hero-btn', { opacity: 0, y: 15 });
      gsap.set('.hero-right', { opacity: 0, y: 15 });
    } else {
      gsap.set(heroRef.current, { opacity: 1 });
      
      // Animate hero text automatically after loader completes & helix rises
      const tl = gsap.timeline({ delay: 3.5 });
      tl.to('.hero-title', {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        y: 0,
        duration: 1.2,
        ease: 'power4.out',
      })
      .to('.hero-sub', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.7')
      .to('.hero-btn', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.4')
      .to('.hero-right', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      }, '-=0.5');
    }
  }, [loaderComplete]);

  useEffect(() => {
    // 1. Left-to-right clip-path wipe reveal for all wipe-titles
    const titles = gsap.utils.toArray('.wipe-title');
    titles.forEach((title) => {
      gsap.fromTo(title,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: title,
            start: 'top 90%',
            end: 'top 45%',
            scrub: 1.0,
          }
        }
      );
    });

    // 2. Pinned Staggered Biomarkers Cards Reveal (Section 2.5 - Comes first in DOM)
    const cards = gsap.utils.toArray('.biomarker-card');
    if (cards.length > 0) {
      gsap.set(cards, { opacity: 0, y: 30 });
      gsap.set('#methodology', { opacity: 0 }); // Hide methodology initially to prevent early leak

      const biomarkersTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#biomarkers',
          start: 'top top',
          end: '+=450%', // Pin for 4.5 screen heights of scrolling
          pin: true,
          scrub: 0.1,    // High responsiveness to scroll position
          anticipatePin: 1,
        }
      });

      // Keep methodology hidden during the card reveals
      biomarkersTimeline.to('#methodology', { opacity: 0, duration: 0.1 }, 0);

      // Reveal card 1 to 4 (Row 1)
      biomarkersTimeline.to(cards[0], { opacity: 1, y: 0, duration: 0.5 }, 0.0)
                        .to(cards[1], { opacity: 1, y: 0, duration: 0.5 }, 0.3)
                        .to(cards[2], { opacity: 1, y: 0, duration: 0.5 }, 0.6)
                        .to(cards[3], { opacity: 1, y: 0, duration: 0.5 }, 0.9);

      // Shift the entire content wrapper up (heading + cards) to bring row 2 into view without merging
      biomarkersTimeline.to('.biomarkers-content-wrapper', { y: -260, duration: 0.8, ease: 'power2.inOut' }, 1.4);

      // Reveal card 5 to 8 (Row 2)
      biomarkersTimeline.to(cards[4], { opacity: 1, y: 0, duration: 0.5 }, 2.2)
                        .to(cards[5], { opacity: 1, y: 0, duration: 0.5 }, 2.5)
                        .to(cards[6], { opacity: 1, y: 0, duration: 0.5 }, 2.8)
                        .to(cards[7], { opacity: 1, y: 0, duration: 0.5 }, 3.1);

      // Add a hold pause at the end so all 8 fully arrived cards stay visible before unpinning
      biomarkersTimeline.to({}, { duration: 1.2 }, 3.6);
    }

    // 3. Methodology Smooth Viewport-Entry Fade-In (Section 3 - Comes second in DOM)
    gsap.fromTo('#methodology',
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#methodology',
          start: 'top bottom', // Starts fading in when the top edge of #methodology enters the bottom of screen
          end: 'top 50%',    // Reaches full opacity when halfway up the screen
          scrub: true,
        }
      }
    );

    // 3.5. Pinned Methodology Slideshow
    const steps = gsap.utils.toArray('.methodology-step');
    if (steps.length > 0) {
      gsap.set(steps, { opacity: 0, y: 20, pointerEvents: 'none' });
      gsap.set(steps[0], { opacity: 1, y: 0, pointerEvents: 'auto' });

      const pinTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#methodology',
          start: 'top top',
          end: '+=600%', // Pin for 6 screen heights of scrolling - extremely long scroll area
          pin: true,
          scrub: 0.1,    // Near-instant response to scrollbar position
          anticipatePin: 1,
        }
      });

      // Ensure methodology remains fully visible while pinned
      pinTimeline.to('#methodology', { opacity: 1, duration: 0.1 }, 0);

      // Step 1 -> Step 2 transition from 2.0 to 2.8
      pinTimeline.to(steps[0], { opacity: 0, y: -20, pointerEvents: 'none', duration: 0.5 }, 2.0)
                 .fromTo(steps[1], { opacity: 0, y: 20 }, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.5 }, 2.3);

      // Step 2 stays visible from 2.8 to 4.5
      
      // Step 2 -> Step 3 transition from 4.5 to 5.3
      pinTimeline.to(steps[1], { opacity: 0, y: -20, pointerEvents: 'none', duration: 0.5 }, 4.5)
                 .fromTo(steps[2], { opacity: 0, y: 20 }, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.5 }, 4.8);

      // Step 3 stays visible from 5.3 to 7.0
      
      // Step 3 -> Step 4 transition from 7.0 to 7.8
      pinTimeline.to(steps[2], { opacity: 0, y: -20, pointerEvents: 'none', duration: 0.5 }, 7.0)
                 .fromTo(steps[3], { opacity: 0, y: 20 }, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.5 }, 7.3);

      // Step 4 stays visible from 7.8 to 9.0
      pinTimeline.to({}, { duration: 1.2 }, 7.8);
    }

    // 4. Auto-navigate to diagnosis on scrolling past the footer
    ScrollTrigger.create({
      trigger: 'footer',
      start: 'bottom bottom-=20',
      onEnter: () => {
        onNavigate('diagnosis');
      },
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleScrollTo = (id) => {
    if (window.lenis) {
      window.lenis.scrollTo(id, { offset: -64 });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="w-full bg-transparent relative z-10">
      
      {/* SECTION 1: HERO (Stark void, giant typography, left-right balanced layout) */}
      <section ref={heroRef} className="relative w-full h-screen flex flex-col justify-center items-start overflow-hidden px-6 md:px-[8vw]">
        <div className="w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
          {/* Left Column */}
          <div className="flex flex-col items-start">
            <h1 className="hero-title font-syne font-extrabold text-[clamp(3rem,14vw,12rem)] leading-[0.85] tracking-[-0.04em] text-[var(--text-1)] mb-8 select-none ml-[-6px] md:ml-[-6vw]" style={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}>
              GLYCOS
            </h1>
            <p className="hero-sub font-mono text-[clamp(1.1rem,1.8vw,1.4rem)] text-[var(--text-3)] tracking-tight max-w-xl mb-12">
              Know your metabolic future before it arrives.
            </p>
            <div className="hero-btn">
              <PremiumButton
                variant="primary"
                className="px-10 py-5"
                onClick={() => onNavigate('diagnosis')}
              >
                Analyze Risk <ArrowRight size={16} />
              </PremiumButton>
            </div>
          </div>
          {/* Right Column */}
          <div className="hero-right hidden lg:flex flex-col items-end text-right max-w-md ml-auto gap-4 mt-auto">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-2)] uppercase">[CALIBRATION_ENGINE_V2]</span>
            <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed">
              Powered by a local Gradient Descent solver. Maps insulin response metrics dynamically against population cohorts to flag susceptibility curves.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE STAT WALL (Giant cropped typography numbers) */}
      <section id="stats" className="w-full py-48 md:py-72 px-6 md:px-[8vw] border-t border-b border-[var(--border-soft)] relative z-10 bg-transparent">
        <div className="flex flex-col gap-40 w-full overflow-visible">
          
          {/* Stat 1 */}
          <div className="relative flex flex-col items-start group">
            <div className="w-full overflow-visible">
              <h2 className="font-syne font-extrabold text-[clamp(3.5rem,12vw,12rem)] leading-none text-[var(--text-1)] tracking-[-0.06em] select-none whitespace-nowrap ml-[-6px] md:ml-[-6vw]">
                <ScrambleNumber value="537M" />
              </h2>
            </div>
            <div className="flex flex-col gap-2 mt-6 max-w-xl">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase">[METRIC_GLOBAL_INCIDENCE]</span>
              <p className="font-mono text-sm md:text-base text-[var(--text-3)] leading-relaxed">
                People currently living with diabetes globally. The scale demands client-side, zero-latency clinical intelligence.
              </p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="relative flex flex-col items-start group">
            <div className="w-full overflow-visible">
              <h2 className="font-syne font-extrabold text-[clamp(3.5rem,12vw,12rem)] leading-none text-[var(--text-1)] tracking-[-0.06em] select-none whitespace-nowrap ml-[-6px] md:ml-[-6vw]">
                <ScrambleNumber value="80%" />
              </h2>
            </div>
            <div className="flex flex-col gap-2 mt-6 max-w-xl">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase">[PREVENTION_INDEX]</span>
              <p className="font-mono text-sm md:text-base text-[var(--text-3)] leading-relaxed">
                Of Type 2 diabetes cases are entirely preventable. Timely prediction allows calibrated therapeutic interventions.
              </p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="relative flex flex-col items-start group">
            <div className="w-full overflow-visible">
              <h2 className="font-syne font-extrabold text-[clamp(3.5rem,12vw,12rem)] leading-none text-[var(--text-1)] tracking-[-0.06em] select-none whitespace-nowrap ml-[-6px] md:ml-[-6vw]">
                <ScrambleNumber value="77.3%" />
              </h2>
            </div>
            <div className="flex flex-col gap-2 mt-6 max-w-xl">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase">[CLASSIFIER_ACCURACY]</span>
              <p className="font-mono text-sm md:text-base text-[var(--text-3)] leading-relaxed">
                Validated predictive accuracy calibrated on longitudinal clinical studies of Pima Indians diabetes records.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2.5: CLINICAL BIOMARKERS DETAILED GRID */}
      <section id="biomarkers" className="w-full min-h-screen flex flex-col justify-center py-24 px-6 md:px-[8vw] border-b border-[var(--border-soft)] relative z-10 bg-transparent">
        <div className="biomarkers-content-wrapper w-full flex flex-col items-start">
        <div className="flex flex-col items-start w-full mb-24">
          <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase mb-8">
            [CLINICAL_COHORT_VARIABLES]
          </span>
          <h2 className="wipe-title font-syne font-bold text-[clamp(2.5rem,8vw,8rem)] leading-[0.9] tracking-[-0.04em] text-[var(--text-1)] mb-8 ml-[-4px] md:ml-[-6vw]">
            The Eight<br />Biomarkers.
          </h2>
          <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-xl">
            GLYCOS calibrates risk probability by running local regression coefficients across eight independent physiological factors.
          </p>
        </div>

        <div className="biomarkers-grid-wrapper grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {/* Variable 1 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[01]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Pregnancies</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Gestational hormone surges impacting peripheral insulin resistance.
              </p>
            </div>
          </div>

          {/* Variable 2 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[02]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Blood Glucose</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                2-hour plasma concentration during oral glucose tolerance testing.
              </p>
            </div>
          </div>

          {/* Variable 3 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[03]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Blood Pressure</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Diastolic pressure (mmHg) reflecting diastolic vascular elasticity.
              </p>
            </div>
          </div>

          {/* Variable 4 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[04]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Skin Thickness</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Triceps skin fold thickness (mm) measuring fat reserves.
              </p>
            </div>
          </div>

          {/* Variable 5 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[05]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Serum Insulin</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                2-hour serum insulin level indicating active beta-cell production.
              </p>
            </div>
          </div>

          {/* Variable 6 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[06]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">BMI</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Body Mass Index measuring systemic adipose tissue burden.
              </p>
            </div>
          </div>

          {/* Variable 7 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[07]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Pedigree Score</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Genetic predisposition ratio based on multigenerational history.
              </p>
            </div>
          </div>

          {/* Variable 8 */}
          <div className="biomarker-card border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:border-[var(--text-1)] group">
            <span className="font-mono text-[10px] text-[var(--text-3)]">[08]</span>
            <div className="mt-8">
              <h3 className="font-syne font-bold text-lg text-[var(--text-1)] mb-2">Age</h3>
              <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                Chronological age linked with progressive beta-cell depletion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* SECTION 3: PINNED METHODOLOGY */}
      <section id="methodology" className="w-full min-h-screen flex flex-col justify-center py-24 px-6 md:px-[8vw] border-b border-[var(--border-soft)] relative z-10 bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          
          {/* Pinned Left Column (5/12 width) */}
          <div className="lg:col-span-5 w-full flex flex-col items-start text-left lg:min-h-[500px]">
            <div id="pinned-left-col" className="flex flex-col items-start w-full pr-4 py-2">
              <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase mb-8">
                [METHODOLOGY]
              </span>
              <h2 className="wipe-title font-syne font-bold text-[clamp(2.5rem,8vw,8rem)] leading-[0.9] tracking-[-0.04em] text-[var(--text-1)] mb-8 ml-[-4px] md:ml-[-6vw]">
                Clinical AI.<br />Simplified.
              </h2>
              <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-md">
                All metrics are normalized and evaluated in-browser using weighted logistic regression coefficients. Completely private, offline estimation.
              </p>
            </div>
          </div>

          {/* Right Column Scrolling Steps (7/12 width) */}
          <div className="lg:col-span-7 relative min-h-[350px] flex items-center justify-start pl-6 md:pl-16">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[var(--border-soft)]" />

            {/* Step 1 */}
            <div className="methodology-step absolute inset-y-0 left-6 md:left-16 flex flex-col justify-center gap-3 items-start group select-none opacity-0 pointer-events-none">
              <div className="absolute -left-[27px] md:-left-[65px] w-2.5 h-2.5 rounded-full bg-[var(--text-1)] border-2 border-[var(--void)] mt-1 transition-transform duration-300 group-hover:scale-125" />
              <span className="font-mono text-xs font-semibold text-[var(--text-2)] uppercase">
                Step 01 / Input
              </span>
              <h3 className="font-syne font-bold text-2xl text-[var(--text-1)]">
                Calibrate Variables
              </h3>
              <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-xl">
                Define the eight metabolic biomarkers including blood glucose levels, body mass index, and pedigree risk factors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="methodology-step absolute inset-y-0 left-6 md:left-16 flex flex-col justify-center gap-3 items-start group select-none opacity-0 pointer-events-none">
              <div className="absolute -left-[27px] md:-left-[65px] w-2.5 h-2.5 rounded-full bg-[var(--text-1)] border-2 border-[var(--void)] mt-1 transition-transform duration-300 group-hover:scale-125" />
              <span className="font-mono text-xs font-semibold text-[var(--text-2)] uppercase">
                Step 02 / Scale
              </span>
              <h3 className="font-syne font-bold text-2xl text-[var(--text-1)]">
                Feature Normalization
              </h3>
              <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-xl">
                Inputs are dynamically scaled using mathematical mean and standard deviation matrices derived from patient clinical records.
              </p>
            </div>

            {/* Step 3 */}
            <div className="methodology-step absolute inset-y-0 left-6 md:left-16 flex flex-col justify-center gap-3 items-start group select-none opacity-0 pointer-events-none">
              <div className="absolute -left-[27px] md:-left-[65px] w-2.5 h-2.5 rounded-full bg-[var(--text-1)] border-2 border-[var(--void)] mt-1 transition-transform duration-300 group-hover:scale-125" />
              <span className="font-mono text-xs font-semibold text-[var(--text-2)] uppercase">
                Step 03 / Compute
              </span>
              <h3 className="font-syne font-bold text-2xl text-[var(--text-1)]">
                Sigmoid Evaluation
              </h3>
              <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-xl">
                A calibrated sigmoid classifier maps the weighted sum of inputs into a normalized risk percentage index.
              </p>
            </div>

            {/* Step 4 */}
            <div className="methodology-step absolute inset-y-0 left-6 md:left-16 flex flex-col justify-center gap-3 items-start group select-none opacity-0 pointer-events-none">
              <div className="absolute -left-[27px] md:-left-[65px] w-2.5 h-2.5 rounded-full bg-[var(--text-1)] border-2 border-[var(--void)] mt-1 transition-transform duration-300 group-hover:scale-125" />
              <span className="font-mono text-xs font-semibold text-[var(--text-2)] uppercase">
                Step 04 / Insight
              </span>
              <h3 className="font-syne font-bold text-2xl text-[var(--text-1)]">
                Calibration Report
              </h3>
              <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-xl">
                Obtain your instant metabolic report alongside clinical impact factor breakdowns and interactive curves.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: FINAL CTA (Electric cyan used on CTA button only) */}
      <section id="cta" className="w-full h-[85vh] flex flex-col justify-center items-center text-center px-6 bg-transparent relative z-10">
        <div className="relative z-10 flex flex-col items-center max-w-4xl">
          <h2 className="wipe-title font-syne font-extrabold text-[clamp(3.5rem,12vw,12rem)] leading-[0.85] tracking-[-0.04em] text-[var(--text-1)] mb-8 uppercase ml-[-6px] md:ml-[-6vw]">
            Analyze
          </h2>
          <p className="font-mono text-sm md:text-base text-[var(--text-3)] max-w-md leading-relaxed mb-12">
            No account required. Instant offline computation in 60 seconds. Private, local execution on clinical coefficients.
          </p>

          <PremiumButton
            variant="cyan"
            className="px-12 py-5"
            onClick={() => onNavigate('diagnosis')}
          >
            Analyze Your Risk <ArrowRight size={16} />
          </PremiumButton>
        </div>
      </section>

      {/* SECTION 4.5: METRICS WAVY TICKER */}
      <section className="w-full border-t border-b border-[var(--border-soft)] bg-[rgba(3,8,9,0.15)] relative z-10 py-6 overflow-hidden">
        <WavyTicker items={tickerItems} />
      </section>

      {/* FOOTER / PROJECT DETAILS & COPYRIGHT CARD */}
      <footer className="w-full py-20 px-6 md:px-[8vw] border-t border-[var(--border-soft)] bg-[rgba(3,8,9,0.4)] backdrop-blur-md relative z-10 text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 items-start">
            <span className="font-syne font-bold text-lg text-[var(--text-1)] uppercase">GLYCOS //</span>
            <span className="font-mono text-[9px] text-[var(--text-2)] tracking-wider">CLINICAL COHERENCE MATRIX</span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[10px] items-start">
            <span className="font-bold text-[var(--text-1)] uppercase tracking-wider mb-2">[ CALIBRATION MODEL ]</span>
            <span className="footer-hover-item">Pima Indians Dataset Cohort</span>
            <span className="footer-hover-item">Local logistic regression solver</span>
            <span className="footer-hover-item">Validation accuracy: ~77.3%</span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[10px] items-start">
            <span className="font-bold text-[var(--text-1)] uppercase tracking-wider mb-2">[ PRIVACY MATRIX ]</span>
            <span className="footer-hover-item">100% In-Browser Execution</span>
            <span className="footer-hover-item">Zero Remote Storage</span>
            <span className="footer-hover-item">Client-side only processing</span>
          </div>
          <div className="flex flex-col gap-2 font-mono text-[10px] items-start">
            <span className="font-bold text-[var(--text-1)] uppercase tracking-wider mb-2">[ SYSTEM METADATA ]</span>
            <span className="footer-hover-item">© 2026 GLYCOS AI. All rights reserved.</span>
            <span className="footer-hover-item">Academic demonstration tool.</span>
            <span className="footer-hover-item">Not for medical diagnostics.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
