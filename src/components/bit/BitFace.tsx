import { useEffect, useRef } from 'react';
import { bitVoice } from '@/services/bit/voice';

export type BitMood = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Bit's face — the robot teacher of the 3D lab, flat: white head, dark visor,
 * glowing eyes and smile. `live`: the mouth opens with the voice's loudness
 * (read every frame from bitVoice, no React re-render); `mood` sets the eyes.
 */
export function BitFace({ size = 28, live = false, mood = 'idle', className }: { size?: number; live?: boolean; mood?: BitMood; className?: string }) {
  const mouth = useRef<SVGEllipseElement>(null);
  const smile = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!live) return;
    const m = mouth.current;
    const sm = smile.current;
    let raf = 0;
    let shown = 0;
    const frame = () => {
      // ease towards the loudness: a mouth that flaps on every sample looks nervous
      shown += (bitVoice.level() - shown) * 0.35;
      const open = shown > 0.04;
      m?.setAttribute('ry', String(open ? 0.8 + shown * 3.4 : 0));
      sm?.setAttribute('opacity', open ? '0' : '1');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      m?.setAttribute('ry', '0');
      sm?.setAttribute('opacity', '1');
    };
  }, [live]);

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" data-mood={mood}>
      <line x1="24" y1="4" x2="24" y2="10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <circle className="bit-antenna" cx="24" cy="4" r="2.6" fill="#ffb35c" />
      <rect x="5" y="10" width="38" height="30" rx="11" fill="#f4f6fb" />
      <rect x="2" y="20" width="4" height="10" rx="2" fill="#2a3142" />
      <rect x="42" y="20" width="4" height="10" rx="2" fill="#2a3142" />
      <rect x="10" y="15" width="28" height="20" rx="7" fill="#0b1328" />
      <g className="bit-eyes" fill="#56dbf8">
        <rect x="15.5" y="20" width="5" height="6" rx="2.5" />
        <rect x="27.5" y="20" width="5" height="6" rx="2.5" />
      </g>
      <path ref={smile} className="bit-mouth" d="M19.5 30q4.5 3 9 0" stroke="#56dbf8" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse ref={mouth} cx="24" cy="30.6" rx="3.4" ry="0" fill="#56dbf8" />
    </svg>
  );
}
