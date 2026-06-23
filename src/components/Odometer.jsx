import React from 'react';

export const Odometer = ({ value, className = '' }) => {
  // Convert value to string and split into individual characters
  const chars = value.toString().split('');

  return (
    <span className={`inline-flex items-baseline select-none overflow-hidden ${className}`}>
      {chars.map((char, index) => {
        const isDigit = /[0-9]/.test(char);
        
        if (!isDigit) {
          // Render decimal points, percent signs, etc., statically
          return (
            <span key={`${char}-${index}`} className="inline-block">
              {char}
            </span>
          );
        }

        const digit = parseInt(char, 10);

        return (
          <span 
            key={`${index}`} 
            className="inline-block relative h-[1em] overflow-hidden"
            style={{ width: '0.62em' }} // Fixed proportional width for monospace alignment
          >
            {/* Scrollable vertical reel of 0-9 */}
            <span
              className="absolute left-0 top-0 w-full flex flex-col transition-transform duration-700 cubic-bezier-[0.34,1.56,0.64,1]"
              style={{
                transform: `translate3d(0, -${digit * 10}%, 0)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <span 
                  key={n} 
                  className="h-[1em] flex items-center justify-center font-mono leading-none"
                  style={{ height: '1em' }}
                >
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default Odometer;
