import { useEffect, useRef } from 'react';

interface GalleryItem {
  id: string;
  image: string;
  title: string;
  type: string;
  year: string;
}

const ITEMS: GalleryItem[] = [
  { id: 'AE-001', image: '/images/gallery_1.jpg', title: 'Neural Pipeline Alpha', type: 'Infrastructure', year: '2024' },
  { id: 'AE-002', image: '/images/gallery_2.jpg', title: 'Monolith Compute Core', type: 'Hardware', year: '2024' },
  { id: 'AE-003', image: '/images/gallery_3.jpg', title: 'Distributed Node Mesh', type: 'Network', year: '2023' },
  { id: 'AE-004', image: '/images/gallery_4.jpg', title: 'Topographic Data Map', type: 'Visualization', year: '2024' },
  { id: 'AE-005', image: '/images/gallery_5.jpg', title: 'Reflective Interface', type: 'UX System', year: '2023' },
  { id: 'AE-006', image: '/images/gallery_6.jpg', title: 'Brutalist Architecture', type: 'Facility', year: '2024' },
  { id: 'AE-007', image: '/images/gallery_1.jpg', title: 'Fiber Interconnect', type: 'Infrastructure', year: '2024' },
  { id: 'AE-008', image: '/images/gallery_3.jpg', title: 'Consensus Protocol', type: 'Network', year: '2023' },
  { id: 'AE-009', image: '/images/gallery_2.jpg', title: 'Edge Compute Module', type: 'Hardware', year: '2024' },
  { id: 'AE-010', image: '/images/gallery_5.jpg', title: 'Glass Interface v2', type: 'UX System', year: '2024' },
  { id: 'AE-011', image: '/images/gallery_6.jpg', title: 'Data Cathedral', type: 'Facility', year: '2023' },
  { id: 'AE-012', image: '/images/gallery_4.jpg', title: 'Contour Analysis', type: 'Visualization', year: '2024' },
];

const COLUMNS = 5;
const COLUMN_OFFSETS = [-20, -10, 0, -10, -20];

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollYRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    const animate = () => {
      const section = sectionRef.current;
      if (!section) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const sectionProgress = Math.max(0, Math.min(1, 1 - (rect.bottom / (vh + rect.height))));

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const col = i % COLUMNS;
        const columnIndex = col / (COLUMNS - 1);

        const xDisp = scrollYRef.current * columnIndex * 0.015;
        const rot = scrollYRef.current * (columnIndex - 0.5) * 0.002;
        const parallaxOffset = COLUMN_OFFSETS[col] * (sectionProgress * 0.5);

        card.style.transform = `translateX(${xDisp}px) translateY(${parallaxOffset}vh) rotateY(${rot}deg)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const columns: GalleryItem[][] = Array.from({ length: COLUMNS }, () => []);
  ITEMS.forEach((item, i) => {
    columns[i % COLUMNS].push(item);
  });

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
      style={{ zIndex: 2, background: '#0a0a0a' }}
    >
      {/* Section Header */}
      <div className="max-w-[1440px] mx-auto px-8 mb-20">
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4.5rem)',
            color: '#ffffff',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Computational Gallery
        </h2>
        <p className="mt-4 text-sm uppercase tracking-widest text-muted-silver">
          Deployed Architectures — 12 Systems
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex gap-[2.5vw]">
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 flex flex-col gap-[2.5vh]"
              style={{ marginTop: `${COLUMN_OFFSETS[colIndex]}vh` }}
            >
              {column.map((item, rowIndex) => {
                const globalIndex = colIndex + rowIndex * COLUMNS;
                return (
                  <div
                    key={item.id}
                    ref={(el) => { cardsRef.current[globalIndex] = el; }}
                    className="gallery-card group cursor-pointer"
                    style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                  >
                    <div className="relative overflow-hidden rounded-sm aspect-[4/3]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-silver mt-1">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-tech text-[10px] text-muted-silver">{item.id}</span>
                        <p className="text-xs text-muted-silver">{item.year}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
