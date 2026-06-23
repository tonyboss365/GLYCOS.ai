import { useEffect, useRef } from 'react';

interface MetricBlock {
  number: string;
  title: string;
  description: string;
}

const METRICS_ROW1: MetricBlock[] = [
  {
    number: '01',
    title: 'Core Infrastructure',
    description: 'Distributed compute nodes with sub-millisecond latency, designed for global-scale data ingestion and real-time processing pipelines.',
  },
  {
    number: '02',
    title: 'Neural Pipelines',
    description: 'End-to-end ML observability frameworks that monitor, trace, and optimize model performance across heterogeneous environments.',
  },
  {
    number: '03',
    title: 'Enterprise Scale',
    description: 'Battle-tested architectures serving Fortune 500 clients with 99.999% uptime across multi-region deployments.',
  },
];

const METRICS_ROW2: MetricBlock[] = [
  {
    number: '04',
    title: 'Data Orchestration',
    description: 'Intelligent workflow engines that automate data transformation, quality assurance, and pipeline orchestration at petabyte scale.',
  },
  {
    number: '05',
    title: 'Autonomous Agents',
    description: 'Self-healing, self-optimizing agentic systems that proactively manage infrastructure without human intervention.',
  },
];

function MetricCard({ metric }: { metric: MetricBlock }) {
  return (
    <div className="metric-block py-12 px-6 cursor-default">
      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-mono-tech text-xs text-muted-silver">{metric.number}</span>
        <h3
          className="font-display"
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 3rem)',
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {metric.title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-silver max-w-md ml-10">
        {metric.description}
      </p>
    </div>
  );
}

export default function Metrics() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      ref={sectionRef}
      className="relative py-32 px-8"
      style={{ zIndex: 2, background: '#000000' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div
          ref={headerRef}
          className="mb-16 opacity-0"
          style={{
            transform: 'translateY(40px)',
            transition: 'all 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4.5rem)',
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Strategic Metrics
          </h2>
          <p className="mt-4 text-sm uppercase tracking-widest text-muted-silver">
            Five Pillars of Infrastructure
          </p>
        </div>

        <div className="metrics-row border-t border-graphite">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-graphite">
            {METRICS_ROW1.map((metric) => (
              <MetricCard key={metric.number} metric={metric} />
            ))}
          </div>
        </div>

        <div className="metrics-row border-t border-b border-graphite">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-graphite">
            {METRICS_ROW2.map((metric) => (
              <MetricCard key={metric.number} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
