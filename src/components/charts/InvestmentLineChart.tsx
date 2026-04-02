import { useMemo } from 'react';
import Svg, { Line, Polyline, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

export interface SnapshotPoint {
  value: number;   // cents
  label: string;   // x-axis label
}

interface Props {
  points: SnapshotPoint[];
  width: number;
  height: number;
}

const PAD = { left: 56, right: 16, top: 16, bottom: 28 };
const GRID_LINES = 4;

function formatY(cents: number): string {
  const e = cents / 100;
  if (Math.abs(e) >= 10000) return `${(e / 1000).toFixed(0)}k`;
  if (Math.abs(e) >= 1000) return `${(e / 1000).toFixed(1)}k`;
  return e.toFixed(0);
}

export function InvestmentLineChart({ points, width, height }: Props) {
  const { colors } = useTheme();
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const n = points.length;

  const { yMin, yMax } = useMemo(() => {
    if (n === 0) return { yMin: 0, yMax: 100000 };
    const vals = points.map((p) => p.value);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const pad = Math.max((mx - mn) * 0.2, 5000);
    return { yMin: Math.max(0, mn - pad), yMax: mx + pad };
  }, [points, n]);

  const yRange = yMax - yMin || 1;
  const ticks = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    yMin + (i / GRID_LINES) * yRange,
  );

  function toX(i: number) {
    return PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  }
  function toY(val: number) {
    return PAD.top + (1 - (val - yMin) / yRange) * plotH;
  }

  const polyPoints = points
    .map((p, i) => `${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`)
    .join(' ');

  // Show at most 6 x-axis labels to avoid overlap
  const labelStep = Math.max(1, Math.ceil(n / 6));
  const visibleLabels = points
    .map((p, i) => ({ ...p, i }))
    .filter((_, i) => i % labelStep === 0 || i === n - 1);

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill={colors.surface} rx={14} />

      {/* Grid */}
      {ticks.map((tick, i) => (
        <Line
          key={`g${i}`}
          x1={PAD.left} y1={toY(tick)}
          x2={PAD.left + plotW} y2={toY(tick)}
          stroke={colors.border} strokeWidth={1} opacity={0.6}
        />
      ))}

      {/* Y labels */}
      {ticks.map((tick, i) => (
        <SvgText
          key={`y${i}`}
          x={PAD.left - 4} y={toY(tick) + 4}
          fontSize={9} fill={colors.textSecondary} textAnchor="end"
        >
          {formatY(tick)}
        </SvgText>
      ))}

      {/* Line */}
      {n >= 2 && (
        <Polyline
          points={polyPoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dots */}
      {points.map((p, i) => (
        <Circle
          key={`d${i}`}
          cx={toX(i)} cy={toY(p.value)}
          r={n === 1 ? 5 : 3}
          fill={colors.primary}
        />
      ))}

      {/* X labels */}
      {visibleLabels.map(({ label, i }) => (
        <SvgText
          key={`x${i}`}
          x={toX(i)} y={height - 6}
          fontSize={9} fill={colors.textSecondary} textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}
