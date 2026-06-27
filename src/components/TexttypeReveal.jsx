import React, { useState, useEffect } from 'react';

// Custom lightweight real-time markdown formatter for premium JSX rendering
export function parseMarkdownToJSX(text) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let content = line;
    let isHeader = false;
    let headerLevel = 0;
    let isBullet = false;

    // Check headers (e.g. ### Header)
    const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      isHeader = true;
      headerLevel = headerMatch[1].length;
      content = headerMatch[2];
    }

    // Check list item (e.g. - Bullet)
    const bulletMatch = content.match(/^[\-\*]\s+(.*)$/);
    if (bulletMatch) {
      isBullet = true;
      content = bulletMatch[1];
    }

    // Split and process bold text (**bold**)
    const parts = content.split('**');
    const processedContent = parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return (
          <strong key={partIdx} className="font-extrabold text-[var(--text-1)] border-b border-[var(--cyan-accent)]/20 pb-0.5">
            {part}
          </strong>
        );
      }
      return part;
    });

    if (isHeader) {
      const headerClasses = headerLevel === 3
        ? "text-xs font-bold font-syne uppercase tracking-wider text-[var(--cyan-accent)] mt-4 mb-2 block border-l-2 border-[var(--cyan-accent)] pl-2"
        : "text-sm font-bold font-syne uppercase tracking-wider text-[var(--cyan-accent)] mt-5 mb-3 block border-l-2 border-[var(--cyan-accent)] pl-2";
      return (
        <span key={lineIdx} className={headerClasses}>
          {processedContent}
        </span>
      );
    }

    if (isBullet) {
      return (
        <span key={lineIdx} className="flex gap-2 pl-3 my-1 leading-relaxed text-xs text-[var(--text-2)] align-top text-left">
          <span className="text-[var(--cyan-accent)] select-none font-bold mt-0.5">&bull;</span>
          <span className="flex-1">{processedContent}</span>
        </span>
      );
    }

    return (
      <span key={lineIdx} className="block my-1 leading-relaxed text-xs text-[var(--text-2)] text-left">
        {processedContent}
      </span>
    );
  });
}

export const TexttypeReveal = ({ text, speed = 8, onUpdate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex >= text.length) return;

    const delay = Math.random() * (speed * 0.8) + (speed * 0.6);
    const timer = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);

      if (onUpdate) {
        setTimeout(onUpdate, 0);
      }

      // Play soft sound click
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
          gain.gain.setValueAtTime(0.005, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.042);
        }
      } catch (e) {
        // Browser context limits
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, currentIndex, speed, onUpdate]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 450);

    return () => clearInterval(blinkInterval);
  }, []);

  const isCompleted = currentIndex >= text.length;

  return (
    <div className="font-inter leading-relaxed text-xs text-left">
      {parseMarkdownToJSX(displayedText)}
      {!isCompleted && (
        <span
          className="inline-block bg-[var(--cyan-accent)] ml-1 align-middle transition-opacity duration-100 animate-pulse"
          style={{
            width: '6px',
            height: '14px',
            opacity: cursorVisible ? 1 : 0
          }}
        />
      )}
    </div>
  );
};

export default TexttypeReveal;
