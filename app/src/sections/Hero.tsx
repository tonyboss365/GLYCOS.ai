import { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const [time, setTime] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            titleRef.current?.classList.add('animate-fade-up');
            setTimeout(() => {
              subtitleRef.current?.classList.add('animate-fade-up');
            }, 200);
          }
        });
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-start px-8 py-8 z-50 mix-blend-difference">
        <div className="flex gap-8 text-xs uppercase tracking-widest text-white">
          <a href="#architecture" className="link-hover cursor-pointer">Architecture</a>
          <a href="#work" className="link-hover cursor-pointer">Work</a>
          <a href="#about" className="link-hover cursor-pointer">About</a>
        </div>
        <div className="flex gap-8 text-xs uppercase tracking-widest text-white">
          <span className="font-mono-tech opacity-70">London</span>
          <span className="font-mono-tech opacity-70">{time}</span>
          <a href="#contact" className="link-hover cursor-pointer">Contact</a>
        </div>
      </nav>

      {/* Hero Title */}
      <div className="text-center px-4">
        <h1
          ref={titleRef}
          className="font-display text-white leading-none opacity-0"
          style={{
            fontSize: 'clamp(3rem, 15vw, 18rem)',
            letterSpacing: '-0.03em',
            lineHeight: 0.9,
          }}
        >
          Aura
          <br />
          Engineering
        </h1>
        <p
          ref={subtitleRef}
          className="mt-8 text-xs uppercase tracking-[0.3em] text-muted-silver opacity-0"
          style={{ animationDelay: '0.2s' }}
        >
          Systems that think. Architectures that scale.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-silver font-mono-tech">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
}
