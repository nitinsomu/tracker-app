import { View, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../constants/colors';
import type { WeightPoint } from '../../types';

interface Props {
  data: WeightPoint[];
}

// Catmull-Rom → cubic bezier smooth path
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// Same path but closed at the bottom for gradient fill
function fillPath(pts: { x: number; y: number }[], h: number): string {
  const line = smoothPath(pts);
  if (!line) return '';
  return `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${h.toFixed(2)} L ${pts[0].x.toFixed(2)} ${h.toFixed(2)} Z`;
}

export default function WeightChart({ data }: Props) {
  const { width } = useWindowDimensions();
  if (data.length < 2) return null;

  const chartWidth = width - 64;
  const chartHeight = 160;
  const pad = { top: 8, right: 8, bottom: 28, left: 42 };
  const w = chartWidth - pad.left - pad.right;
  const h = chartHeight - pad.top - pad.bottom;

  const vals = data.map((d) => d.body_weight_kg);
  const minV = Math.floor(Math.min(...vals) - 1);
  const maxV = Math.ceil(Math.max(...vals) + 1);

  const xS = (i: number) => (i / (data.length - 1)) * w;
  const yS = (v: number) => h - ((v - minV) / (maxV - minV)) * h;

  const pts = data.map((d, i) => ({ x: xS(i), y: yS(d.body_weight_kg) }));

  const yTicks = [minV + 1, (minV + maxV) / 2, maxV - 1];
  const xIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.indigo[500]} stopOpacity="0.18" />
            <Stop offset="1" stopColor={colors.indigo[500]} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <G transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <Line key={i} x1={0} y1={yS(v)} x2={w} y2={yS(v)} stroke={colors.gray[100]} strokeWidth={1} />
          ))}
          {/* Y labels */}
          {yTicks.map((v, i) => (
            <SvgText key={i} x={-6} y={yS(v) + 4} textAnchor="end" fontSize={10} fill={colors.gray[400]}>
              {v.toFixed(1)}
            </SvgText>
          ))}
          {/* Gradient fill */}
          <Path d={fillPath(pts, h)} fill="url(#wGrad)" />
          {/* Smooth line */}
          <Path d={smoothPath(pts)} fill="none" stroke={colors.indigo[500]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.white} stroke={colors.indigo[500]} strokeWidth={2} />
          ))}
          {/* X labels */}
          {xIndices.map((idx) => (
            <SvgText key={idx} x={xS(idx)} y={h + 20} textAnchor="middle" fontSize={10} fill={colors.gray[400]}>
              {data[idx].date.slice(5)}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}
