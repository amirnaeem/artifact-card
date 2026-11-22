type Props = {
  cx: number;
  cy: number;
  len?: number;
  stroke?: number;
  color: string;
  className?: string;
};

/** Eight-point asterisk / spark mark used on front and back. */
export function Asterisk({ cx, cy, len = 72, stroke = 14, color, className }: Props) {
  const arms = [0, 45, 90, 135];
  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden>
      <g className={className}>
        {arms.map((deg) => (
          <line
            key={deg}
            x1={0}
            y1={-len}
            x2={0}
            y2={len}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </g>
  );
}
