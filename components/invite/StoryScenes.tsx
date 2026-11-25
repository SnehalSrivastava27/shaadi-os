import type { StoryScene } from "@/types";

// Original illustrations used as story photos until the couple uploads their own. viewBox 300x400 (3:4).

const marigold = (x: number, y: number, r: number, c: string, k: number) => (
  <g key={k}>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <circle key={i} cx={x + Math.cos(a) * r * 0.5} cy={y + Math.sin(a) * r * 0.5} r={r * 0.55} fill={c} />;
    })}
    <circle cx={x} cy={y} r={r * 0.55} fill={c} stroke="#B45309" strokeOpacity="0.3" />
  </g>
);

function Chai() {
  const bulbs = Array.from({ length: 11 }, (_, i) => ({ x: 10 + i * 28, y: 70 + Math.sin((i / 10) * Math.PI) * 38 }));
  return (
    <>
      <defs>
        <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2A4D" />
          <stop offset="0.6" stopColor="#B4586B" />
          <stop offset="1" stopColor="#F2A65A" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="400" fill="url(#dusk)" />
      <path d={`M0 66 ${bulbs.map((b) => `L${b.x} ${b.y}`).join(" ")} L300 66`} stroke="#2a1d14" strokeWidth="1.2" fill="none" />
      {bulbs.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y + 6} r="14" fill="url(#glow)" opacity="0.7" />
          <circle cx={b.x} cy={b.y + 6} r="4" fill="#FFE39A" />
        </g>
      ))}
      <rect x="0" y="300" width="300" height="100" fill="#6B3B2A" />
      <rect x="0" y="296" width="300" height="8" fill="#8A4E35" />
      {[105, 185].map((x, i) => (
        <g key={x}>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M${x - 8 + k * 8} 222 c-8 -14 8 -22 0 -36`} stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ))}
          <path d={`M${x - 26} 236 h52 l-8 60 h-36 Z`} fill="#B5562F" />
          <path d={`M${x - 26} 236 h52`} stroke="#E8A87C" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx={x} cy="238" rx="22" ry="3.5" fill="#C98A4B" />
          {i === 1 && <path d={`M${x + 26} 250 c16 0 16 26 -4 26`} stroke="#B5562F" strokeWidth="5" fill="none" />}
        </g>
      ))}
      <path d="M150 170 c-6 -10 -20 -6 -18 6 c2 10 18 18 18 18 s16 -8 18 -18 c2 -12 -12 -16 -18 -6z" fill="#FFB3C1" opacity="0.9" />
    </>
  );
}

function Rings() {
  const petals = [
    [40, 80, 20], [250, 60, -30], [70, 330, 40], [230, 320, 10], [150, 40, 60], [270, 200, -20], [30, 210, 30],
  ];
  return (
    <>
      <defs>
        <linearGradient id="blush" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCE7EF" />
          <stop offset="1" stopColor="#F7C6D4" />
        </linearGradient>
        <linearGradient id="gold" x1="0" x2="1">
          <stop offset="0" stopColor="#9A6A12" />
          <stop offset="0.5" stopColor="#F6D27A" />
          <stop offset="1" stopColor="#A87518" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#blush)" />
      {petals.map(([x, y, r], i) => (
        <path key={i} d="M0 0 c10 -14 26 -10 22 4 c-4 12 -18 14 -22 -4z" fill={i % 2 ? "#EC4899" : "#F9A8D4"} opacity="0.75" transform={`translate(${x} ${y}) rotate(${r})`} />
      ))}
      <circle cx="122" cy="215" r="52" fill="none" stroke="url(#gold)" strokeWidth="13" />
      <circle cx="178" cy="215" r="52" fill="none" stroke="url(#gold)" strokeWidth="13" />
      <path d="M152 178 a52 52 0 0 1 0 74" fill="none" stroke="url(#gold)" strokeWidth="13" />
      <path d="M178 150 l12 -16 h-24 z" fill="#E0F2FE" stroke="#93C5FD" />
      <path d="M166 134 l12 -12 l12 12 z" fill="#F0F9FF" stroke="#93C5FD" />
      {[[210, 120], [100, 140], [235, 270]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 10} L${x + 3} ${y - 3} L${x + 10} ${y} L${x + 3} ${y + 3} L${x} ${y + 10} L${x - 3} ${y + 3} L${x - 10} ${y} L${x - 3} ${y - 3} Z`} fill="#fff" />
      ))}
      <text x="150" y="335" textAnchor="middle" fontSize="20" fontStyle="italic" fill="#9D174D" fontFamily="Georgia, serif">
        she said yes
      </text>
    </>
  );
}

function Haldi() {
  const ring = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return marigold(150 + Math.cos(a) * 112, 230 + Math.sin(a) * 112, 14, ["#F59E0B", "#F97316", "#FBBF24"][i % 3], i);
  });
  return (
    <>
      <defs>
        <radialGradient id="sun" cx="0.5" cy="0.45">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="1" stopColor="#F9C80E" />
        </radialGradient>
        <linearGradient id="brass2" x1="0" x2="1">
          <stop offset="0" stopColor="#8A5A12" />
          <stop offset="0.45" stopColor="#F2C14E" />
          <stop offset="1" stopColor="#9A6716" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#sun)" />
      {Array.from({ length: 24 }, (_, i) => (
        <circle key={i} cx={(i * 97) % 300} cy={(i * 57) % 400} r={2 + (i % 4)} fill="#F59E0B" opacity="0.35" />
      ))}
      {ring}
      <ellipse cx="150" cy="248" rx="70" ry="16" fill="#7C4A0E" opacity="0.25" />
      <path d="M86 222 h128 c-4 30 -30 44 -64 44 s-60 -14 -64 -44z" fill="url(#brass2)" />
      <ellipse cx="150" cy="222" rx="64" ry="13" fill="#E9A23B" />
      <ellipse cx="150" cy="220" rx="56" ry="10" fill="#F4B400" />
      <path d="M128 216 q22 -10 44 0" stroke="#FFD54F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M190 160 l26 -40" stroke="#5B8C2A" strokeWidth="5" strokeLinecap="round" />
      <path d="M216 120 c10 -6 22 0 16 12 c-8 2 -16 -2 -16 -12z" fill="#4D7C0F" />
    </>
  );
}

function Mehendi() {
  return (
    <>
      <defs>
        <linearGradient id="peach" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDE6D2" />
          <stop offset="1" stopColor="#F6C4A0" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#peach)" />
      <g fill="#E6B08A" stroke="#C98D63" strokeWidth="1.5">
        {[
          [104, 70, 26, 120],
          [136, 50, 28, 140],
          [170, 58, 27, 132],
          [202, 86, 24, 108],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={w / 2} />
        ))}
        <rect x="76" y="168" width="40" height="96" rx="20" transform="rotate(-38 96 216)" />
        <path d="M100 168 h128 v110 c0 40 -26 70 -64 70 s-64 -30 -64 -70z" />
        <rect x="124" y="330" width="80" height="80" />
      </g>
      <g stroke="#8B3A1A" fill="none" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="164" cy="250" r="30" />
        <circle cx="164" cy="250" r="20" />
        <circle cx="164" cy="250" r="7" fill="#8B3A1A" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <path key={i} d={`M${164 + Math.cos(a) * 30} ${250 + Math.sin(a) * 30} q${Math.cos(a + 0.5) * 10} ${Math.sin(a + 0.5) * 10} ${Math.cos(a) * 12} ${Math.sin(a) * 12}`} />;
        })}
        {[117, 150, 183, 214].map((x, i) => (
          <g key={x}>
            <path d={`M${x} ${92 + (i === 1 ? -14 : i === 2 ? -8 : i === 3 ? 20 : 6)} v14 m-6 10 h12 m-12 8 h12`} />
            <circle cx={x} cy={160} r="4" />
          </g>
        ))}
        <path d="M120 300 q44 18 88 0 M124 316 q40 14 80 0" />
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={128 + i * 9} cy={338} r="1.8" fill="#8B3A1A" />
        ))}
      </g>
    </>
  );
}

const SCENES: Record<StoryScene, () => React.ReactElement> = { chai: Chai, rings: Rings, haldi: Haldi, mehendi: Mehendi };

export function StoryIllustration({ scene, className }: { scene: StoryScene; className?: string }) {
  const Scene = SCENES[scene] ?? Chai;
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <Scene />
    </svg>
  );
}
