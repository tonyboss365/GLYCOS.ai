import { useEffect, useRef, useState } from 'react';

export default function Showcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && headerRef.current) {
            headerRef.current.style.opacity = '1';
            headerRef.current.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrolled = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.max(0, Math.min(1, scrolled)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center px-8 py-32"
      style={{ zIndex: 2, background: '#000000' }}
    >
      {/* Header */}
      <h2
        ref={headerRef}
        className="font-display text-center mb-16"
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 7rem)',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          opacity: 0,
          transform: 'translateY(40px)',
          transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        Observing the unseen
      </h2>

      {/* Image showcase */}
      <div className="relative w-full max-w-[1440px] mx-auto overflow-hidden rounded-lg">
        <div
          className="relative w-full"
          style={{ paddingBottom: '42.85%' }}
        >
          <img
            src="/images/gallery_4.jpg"
            alt="Abstract computational topology"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10">
          <div
            className="h-full bg-white/60"
            style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
          />
        </div>

        {/* Playhead indicator */}
        <div className="absolute bottom-6 left-8 flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center cursor-pointer hover:border-white/80 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <polygon points="2,1 10,6 2,11" />
            </svg>
          </div>
          <span className="font-mono-tech text-[10px] uppercase tracking-wider text-white/50">
            {String(Math.floor(progress * 2)).padStart(2, '0')}:
            {String(Math.floor((progress * 2 % 1) * 60)).padStart(2, '0')} / 02:00
          </span>
        </div>
      </div>
    </section>
  );
}
