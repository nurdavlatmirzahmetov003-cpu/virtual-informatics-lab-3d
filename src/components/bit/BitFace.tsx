/** Bit's face — the robot teacher of the 3D lab, flat: white head, dark visor, glowing eyes and smile. */
export function BitFace({ size = 28, talking = false, className }: { size?: number; talking?: boolean; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" data-talking={talking || undefined}>
      <line x1="24" y1="4" x2="24" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <circle cx="24" cy="4" r="2.6" fill="#ffb35c" />
      <rect x="5" y="10" width="38" height="30" rx="11" fill="#f4f6fb" />
      <rect x="2" y="20" width="4" height="10" rx="2" fill="#2a3142" />
      <rect x="42" y="20" width="4" height="10" rx="2" fill="#2a3142" />
      <rect x="10" y="15" width="28" height="20" rx="7" fill="#0b1328" />
      <g className="bit-eyes" fill="#56dbf8">
        <rect x="15.5" y="20" width="5" height="6" rx="2.5" />
        <rect x="27.5" y="20" width="5" height="6" rx="2.5" />
      </g>
      <path className="bit-mouth" d="M19.5 30q4.5 3 9 0" stroke="#56dbf8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
