import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

export type DonutSlice = { color: string; value: number };

interface Props {
  slices: DonutSlice[];
  centerLabel: string;
  size?: number;
  ringWidth?: number;
}

function arcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  const f = (n: number) => n.toFixed(3);
  const ox1 = cx + outerR * Math.cos(startAngle);
  const oy1 = cy + outerR * Math.sin(startAngle);
  const ox2 = cx + outerR * Math.cos(endAngle);
  const oy2 = cy + outerR * Math.sin(endAngle);
  const ix1 = cx + innerR * Math.cos(startAngle);
  const iy1 = cy + innerR * Math.sin(startAngle);
  const ix2 = cx + innerR * Math.cos(endAngle);
  const iy2 = cy + innerR * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${f(ox1)} ${f(oy1)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${f(ox2)} ${f(oy2)}`,
    `L ${f(ix2)} ${f(iy2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${f(ix1)} ${f(iy1)}`,
    'Z',
  ].join(' ');
}

export function DonutChart({ slices, centerLabel, size = 120, ringWidth = 20 }: Props) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR - ringWidth;
  const ringR = (outerR + innerR) / 2;
  const textWidth = innerR * 2 - 10;

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const active = slices.filter((s) => s.value > 0);

  const centerContent = (
    <View style={[StyleSheet.absoluteFill, styles.center]}>
      <Text
        style={[styles.label, { color: total === 0 ? colors.textSecondary : colors.text, width: textWidth }]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {centerLabel}
      </Text>
    </View>
  );

  if (total === 0 || active.length === 0) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={ringR} fill="none" stroke={colors.border} strokeWidth={ringWidth} />
        </Svg>
        {centerContent}
      </View>
    );
  }

  if (active.length === 1) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={ringR} fill="none" stroke={active[0].color} strokeWidth={ringWidth} />
        </Svg>
        {centerContent}
      </View>
    );
  }

  let angle = -Math.PI / 2;
  const paths = active.map((slice) => {
    const sweep = (slice.value / total) * 2 * Math.PI;
    const end = angle + sweep;
    const d = arcPath(cx, cy, outerR, innerR, angle, end);
    angle = end;
    return { color: slice.color, d };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.color} />
        ))}
      </Svg>
      {centerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
