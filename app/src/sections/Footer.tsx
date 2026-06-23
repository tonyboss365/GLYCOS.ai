export default function Footer() {
  return (
    <footer
      className="relative px-8 py-24"
      style={{ zIndex: 2, background: '#000000', minHeight: '50vh' }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col justify-between h-full">
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(3rem, 12vw, 14rem)',
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            marginBottom: '4rem',
          }}
        >
          Next Era
          <br />
          Systems
        </h2>

        <div className="flex flex-wrap gap-8 mb-16">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors link-hover">
            X (Twitter)
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors link-hover">
            LinkedIn
          </a>
          <a href="#privacy" className="text-sm text-white/60 hover:text-white transition-colors link-hover">
            Privacy
          </a>
          <a href="#terms" className="text-sm text-white/60 hover:text-white transition-colors link-hover">
            Terms
          </a>
        </div>

        <div className="flex justify-end">
          <p
            className="font-mono-tech text-right"
            style={{ fontSize: '10px', color: '#7c7c7c', lineHeight: 1.6, maxWidth: '400px' }}
          >
            &copy; {new Date().getFullYear()} Aura Engineering Corp. All rights reserved.
            Unauthorized access, distribution, or reverse engineering of any systems,
            architectures, or methodologies described herein is strictly prohibited.
            Patent pending.
          </p>
        </div>
      </div>
    </footer>
  );
}
