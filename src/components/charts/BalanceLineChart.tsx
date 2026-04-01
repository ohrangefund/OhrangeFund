import { useMemo } from 'react';
import Svg, { Line, Polyline, Text as SvgText, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

export type LineData = { color: string; label: string; values: number[] };

interface Props {
  lines: LineData[];
  monthLabels: string[];
  width: number;
  height: number;
}

const PAD = { left: 52, right: 12, top: 14, bottom: 28 };
const GRID_LINES = 4;

function formatY(cents: number): string {
  const e = cents / 100;
  if (Math.abs(e) >= 10000) return `${(e / 1000).toFixed(0)}k`;
  if (Math.abs(e) >= 1000) return `${(e / 1000).toFixed(1)}k`;
  return e.toFixed(0);
}

export function BalanceLineChart({ lines, monthLabels, width, height }: Props) {
  const { colors } = useTheme();
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const n = monthLabels.length;

  const { yMin, yMax } = useMemo(() => {
    const all = lines.flatMap((l) => l.values);
    if (all.length === 0) return { yMin: 0, yMax: 100000 };
    const mn = Math.min(...all);
    const mx = Math.max(...all);
    const pad = Math.max((mx - mn) * 0.15, 5000);
    return { yMin: mn - pad, yMax: mx + pad };
  }, [lines]);

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

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill={colors.surface} rx={14} />

      {/* grid lines */}
      {ticks.map((tick, i) => (
        <Line
          key={`grid-${i}`}
          x1={PAD.left} y1={toY(tick)}
          x2={PAD.left + plotW} y2={toY(tick)}
          stroke={colors.border} strokeWidth={1} opacity={0.7}
        />
      ))}

      {/* Y axis labels */}
      {ticks.map((tick, i) => (
        <SvgText
          key={`ylabel-${i}`}
          x={PAD.left - 4} y={toY(tick) + 4}
          fontSize={9} fill={colors.textSecondary}
          textAnchor="end"
        >
          {formatY(tick)}
        </SvgText>
      ))}

      {/* lines */}
      {lines.map((line, li) => {
        const pts = line.values
          .map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
          .join(' ');
        return (
          <Polyline
            key={li}
            points={pts}
            fill="none"
            stroke={line.color}
            strokeWidth={li === 0 ? 2.5 : 1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {/* X axis labels */}
      {monthLabels.map((label, i) => (
        <SvgText
          key={`xlabel-${i}`}
          x={toX(i)} y={height - 8}
          fontSize={9} fill={colors.textSecondary}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}
