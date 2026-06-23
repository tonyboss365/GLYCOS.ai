import React, { useState, useEffect } from 'react';
import PremiumButton from './PremiumButton';

export const Navbar = ({ currentPage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e, sectionId) => {
    e.preventDefault();
    if (currentPage !== 'landing') {
      onNavigate('landing');
      // Wait a moment for transition before scrolling
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-[64px] z-[100] flex items-center justify-between px-6 md:px-16 transition-all duration-300 backdrop-blur-[20px] saturate-[180%] ${
        isScrolled
          ? 'bg-[var(--nav-bg-scrolled)] border-b border-[var(--border-mid)]'
          : 'bg-[var(--nav-bg-default)] border-b border-[var(--border-soft)]'
      }`}
    >
      {/* Left side brand logo */}
      <div 
        onClick={() => onNavigate('landing')}
        className="font-syne font-bold text-lg cursor-pointer tracking-tight text-[var(--text-1)] select-none"
      >
        GLYCOS
      </div>

      {/* Right side options */}
      <div className="flex items-center gap-6 md:gap-8">
        {currentPage === 'landing' ? (
          <>
            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#methodology"
                onClick={(e) => handleLinkClick(e, 'methodology')}
                className="nav-link-underline font-inter font-medium text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors duration-300"
              >
                Methodology
              </a>
              <a
                href="#biomarkers"
                onClick={(e) => handleLinkClick(e, 'biomarkers')}
                className="nav-link-underline font-inter font-medium text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors duration-300"
              >
                Biomarkers
              </a>
              <a
                href="#cta"
                onClick={(e) => handleLinkClick(e, 'cta')}
                className="nav-link-underline font-inter font-medium text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors duration-300"
              >
                Analyze
              </a>
            </div>

            {/* CTA Button */}
            <PremiumButton
              variant="nav"
              onClick={() => onNavigate('diagnosis')}
            >
              Analyze Risk
            </PremiumButton>
          </>
        ) : (
          /* Diagnosis app back arrow */
          <button
            onClick={() => onNavigate('landing')}
            className="nav-link-underline font-inter font-medium text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors duration-300 flex items-center gap-2 group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
              &larr;
            </span>{' '}
            Back to Home
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
