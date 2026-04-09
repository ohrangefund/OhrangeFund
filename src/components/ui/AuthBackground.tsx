import { useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  compact?: boolean;
  color?: string;
}

export function AuthBackground({ compact = false, color = '#F97316' }: Props) {
  const { width } = useWindowDimensions();

  const rings = compact
    ? [
        { r: 220, o: 0.05 },
        { r: 155, o: 0.09 },
        { r: 90,  o: 0.14 },
        { r: 35,  o: 0.20 },
      ]
    : [
        { r: 420, o: 0.03 },
        { r: 330, o: 0.055 },
        { r: 240, o: 0.09 },
        { r: 150, o: 0.14 },
        { r: 65,  o: 0.22 },
      ];

  const svgHeight = compact ? 240 : 460;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, width, height: svgHeight }}
      pointerEvents="none"
    >
      <Svg width={width} height={svgHeight}>
        {rings.map(({ r, o }) => (
          <Circle
            key={r}
            cx={width}
            cy={0}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={o}
          />
        ))}
      </Svg>
    </View>
  );
}
