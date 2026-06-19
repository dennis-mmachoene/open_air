import { hexToOklch } from "@/lib/color/convert";

/** Hue-wheel diagram: each swatch plotted by hue angle, radius by chroma. A
 *  recurring signature motif that makes the harmony visible. */
export function WhyDiagram({
  hexes,
  size = 220,
}: {
  hexes: string[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - 22;

  const points = hexes.map((hex) => {
    const { c, h } = hexToOklch(hex);
    const radius = Math.min(c / 0.16, 1) * rMax;
    const theta = (h * Math.PI) / 180;
    return {
      hex,
      x: cx + radius * Math.cos(theta),
      y: cy - radius * Math.sin(theta),
    };
  });

  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Hue wheel showing where each colour sits"
    >
      <circle cx={cx} cy={cy} r={rMax} fill="none" stroke="var(--border)" />
      <circle cx={cx} cy={cy} r={rMax / 2} fill="none" stroke="var(--border)" strokeDasharray="2 4" />
      {ticks.map((deg) => {
        const t = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + (rMax - 6) * Math.cos(t)}
            y1={cy - (rMax - 6) * Math.sin(t)}
            x2={cx + rMax * Math.cos(t)}
            y2={cy - rMax * Math.sin(t)}
            stroke="var(--border-strong)"
          />
        );
      })}
      {points.map((p, i) => (
        <line key={`l-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" />
      ))}
      {points.map((p, i) => (
        <circle key={`c-${i}`} cx={p.x} cy={p.y} r={9} fill={p.hex} stroke="var(--surface)" strokeWidth={2} />
      ))}
    </svg>
  );
}
