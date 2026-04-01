import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

export type MonthBarData = { month: string; income: number; expense: number };

interface Props {
  data: MonthBarData[];
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

export function IncomeExpenseBarChart({ data, width, height }: Props) {
  const { colors } = useTheme();
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const n = data.length;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const yMax = maxVal * 1.15;

  const ticks = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    (i / GRID_LINES) * yMax,
  );

  const groupW = plotW / n;
  const barW = groupW * 0.33;

  function toY(val: number) {
    return PAD.top + (1 - val / yMax) * plotH;
  }
  function barH(val: number) {
    return (val / yMax) * plotH;
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

      {/* income bars */}
      {data.map((d, i) => {
        const groupX = PAD.left + i * groupW;
        const x = groupX + groupW * 0.08;
        const h = barH(d.income);
        return (
          <Rect
            key={`income-${i}`}
            x={x} y={toY(d.income)}
            width={barW} height={h}
            fill={colors.income} rx={3}
          />
        );
      })}

      {/* expense bars */}
      {data.map((d, i) => {
        const groupX = PAD.left + i * groupW;
        const x = groupX + groupW * 0.08 + barW + groupW * 0.05;
        const h = barH(d.expense);
        return (
          <Rect
            key={`expense-${i}`}
            x={x} y={toY(d.expense)}
            width={barW} height={h}
            fill={colors.expense} rx={3}
          />
        );
      })}

      {/* X axis labels */}
      {data.map((d, i) => (
        <SvgText
          key={`xlabel-${i}`}
          x={PAD.left + i * groupW + groupW / 2}
          y={height - 8}
          fontSize={9} fill={colors.textSecondary}
          textAnchor="middle"
        >
          {d.month}
        </SvgText>
      ))}
    </Svg>
  );
}
