import React from 'react';

interface CheranLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function CheranLogo({ size = 48, className = '', ...props }: CheranLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Background Outer Dark Warm Brown Badge */}
      <circle cx="100" cy="100" r="98" fill="#5C3A21" />
      
      {/* Inner White Ring Gap */}
      <circle cx="100" cy="100" r="91" fill="#FFFFFF" />
      
      {/* Inner Thin Brown Accent Circle */}
      <circle cx="100" cy="100" r="84" stroke="#5C3A21" strokeWidth="4" fill="none" />

      {/* Coffee Cup Symbol */}
      <g stroke="#5C3A21" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Steam Lines */}
        <path d="M96 34 C93 39, 99 43, 96 48" strokeWidth="3" />
        <path d="M102 30 C99 36, 105 40, 102 46" strokeWidth="3" />
        <path d="M108 34 C105 39, 111 43, 108 48" strokeWidth="3" />

        {/* Cup Outline */}
        <path d="M120 52 A22 22 0 1 0 120 88" strokeWidth="5" />

        {/* Coffee Level Fill */}
        <path d="M84 70 Q100 76 116 70" strokeWidth="4" fill="#5C3A21" />

        {/* Cup Handle */}
        <path d="M78 60 C70 60 70 78 78 78" strokeWidth="4" />
      </g>

      {/* Brand Text: Cheran */}
      <text
        x="100"
        y="126"
        textAnchor="middle"
        fill="#5C3A21"
        fontSize="36"
        fontWeight="800"
        fontFamily="'Georgia', 'Times New Roman', 'Dancing Script', serif"
        fontStyle="italic"
      >
        Cheran
      </text>

      {/* Subtitle Line: - Cafe - */}
      <line x1="44" y1="145" x2="72" y2="145" stroke="#5C3A21" strokeWidth="2.5" />
      <text
        x="100"
        y="150"
        textAnchor="middle"
        fill="#5C3A21"
        fontSize="17"
        fontWeight="700"
        letterSpacing="4"
        fontFamily="'Space Grotesk', 'Inter', 'Helvetica Neue', sans-serif"
      >
        Cafe
      </text>
      <line x1="128" y1="145" x2="156" y2="145" stroke="#5C3A21" strokeWidth="2.5" />
    </svg>
  );
}

export default CheranLogo;
