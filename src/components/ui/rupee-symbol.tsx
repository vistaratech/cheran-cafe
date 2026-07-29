import React from 'react';

interface RupeeSymbolProps {
  className?: string;
  size?: number;
}

/**
 * Guaranteed 100% accurate Indian Rupee (₹) vector symbol.
 * Prevents OS/font fallback issues (such as rendering as rouble ₽ or dollar $).
 */
export function RupeeSymbol({ className = "inline-block h-3.5 w-3.5", size }: RupeeSymbolProps) {
  const style = size ? { width: size, height: size } : undefined;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-label="Indian Rupee"
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13h5a4 4 0 0 0 0-8H6" />
      <path d="M6 13l7 8" />
    </svg>
  );
}

export default RupeeSymbol;
