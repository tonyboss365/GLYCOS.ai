import { useEffect, useRef } from 'react';

export default function Statement() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && textRef.current) {
            textRef.current.style.opacity = '1';
            textRef.current.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center px-8"
      style={{ zIndex: 2, background: '#000000' }}
    >
      <div className="max-w-5xl mx-auto">
        <p
          ref={textRef}
          className="text-center leading-relaxed"
          style={{
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            fontWeight: 400,
            color: '#f0f0f0',
            opacity: 0,
            transform: 'translateY(40px)',
            transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
            letterSpacing: '-0.01em',
            lineHeight: 1.6,
          }}
        >
          We build autonomous infrastructure for the modern enterprise. From neural
          observability frameworks to real-time data orchestration, we design systems
          that are invisible, resilient, and exponentially powerful.
        </p>
      </div>
    </section>
  );
}
