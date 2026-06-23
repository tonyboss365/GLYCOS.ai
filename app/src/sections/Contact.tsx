import { useState, useRef, useCallback, useEffect } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', enterprise: '', message: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && titleRef.current) {
            titleRef.current.style.opacity = '1';
            titleRef.current.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy,
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Protocol initialized. Transmission queued.');
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative min-h-screen flex flex-col items-center justify-center px-8 py-32"
      style={{ zIndex: 2, background: '#000000' }}
    >
      <h2
        ref={titleRef}
        className="font-display text-center mb-20 opacity-0"
        style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          transform: 'translateY(40px)',
          transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
        The Contact Terminal
      </h2>

      <div
        className="liquid-glass-terminal"
        ref={panelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          maxWidth: '480px',
          width: '100%',
        }}
      >
        <div className="relative p-8" style={{ zIndex: 2 }}>
          <h3
            className="font-mono-tech text-xs uppercase tracking-[0.2em] mb-8"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Initialize Protocol
          </h3>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-silver mb-2 font-mono-tech">
                Designation
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b border-graphite focus:border-white/50 text-white text-sm py-2 outline-none transition-colors placeholder:text-white/20"
                placeholder="Your name"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-silver mb-2 font-mono-tech">
                Enterprise
              </label>
              <input
                type="text"
                value={formData.enterprise}
                onChange={(e) => setFormData({ ...formData, enterprise: e.target.value })}
                className="w-full bg-transparent border-b border-graphite focus:border-white/50 text-white text-sm py-2 outline-none transition-colors placeholder:text-white/20"
                placeholder="Organization"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted-silver mb-2 font-mono-tech">
                Transmission
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full bg-transparent border-b border-graphite focus:border-white/50 text-white text-sm py-2 outline-none transition-colors resize-none placeholder:text-white/20"
                placeholder="Your message"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <button
              type="submit"
              className="shimmer-btn w-full h-12 bg-white text-black text-sm font-medium uppercase tracking-wider rounded-md hover:bg-white/90 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Transmit
            </button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-[10px] uppercase tracking-widest text-muted-silver font-mono-tech">
        Drag to reposition
      </p>
    </section>
  );
}
