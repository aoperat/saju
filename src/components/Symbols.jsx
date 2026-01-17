// --- 전통 문양 SVG 컴포넌트들 ---
export const TaegeukSymbol = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle
      cx="50"
      cy="50"
      r="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.3"
    />
    <path
      d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2"
      fill="currentColor"
      opacity="0.6"
    />
    <circle cx="50" cy="26" r="8" fill="currentColor" opacity="0.3" />
    <circle cx="50" cy="74" r="8" fill="currentColor" opacity="0.8" />
  </svg>
);

export const CloudPattern = ({ className = "" }) => (
  <svg viewBox="0 0 200 100" className={className} preserveAspectRatio="none">
    <path
      d="M20,50 Q35,30 50,50 T80,50 T110,50 T140,50 T170,50 T200,50"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.1"
    />
    <path
      d="M0,70 Q20,50 40,70 T80,70 T120,70 T160,70 T200,70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.1"
    />
  </svg>
);

export const PalgwaeSymbol = ({ className = "" }) => (
  <svg viewBox="0 0 60 60" className={className}>
    <g transform="translate(30,30)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <g key={i} transform={`rotate(${angle})`}>
          <rect
            x="-2"
            y="-28"
            width="4"
            height="8"
            fill="currentColor"
            opacity="0.4"
          />
          <rect
            x="-2"
            y="-18"
            width="4"
            height="8"
            fill="currentColor"
            opacity="0.3"
          />
        </g>
      ))}
    </g>
  </svg>
);




