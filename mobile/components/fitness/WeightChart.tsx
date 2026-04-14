import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/colors';
import type { WeightPoint } from '../../types';

interface Props {
  data: WeightPoint[];
}

export default function WeightChart({ data }: Props) {
  const { width } = useWindowDimensions();
  if (data.length < 2) return null;

  const chartWidth = width - 64; // screen padding
  const chartHeight = 160;
  const pad = { top: 8, right: 8, bottom: 28, left: 42 };
  const w = chartWidth - pad.left - pad.right;
  const h = chartHeight - pad.top - pad.bottom;

  const vals = data.map((d) => d.body_weight_kg);
  const minV = Math.floor(Math.min(...vals) - 1);
  const maxV = Math.ceil(Math.max(...vals) + 1);

  const xS = (i: number) => (i / (data.length - 1)) * w;
  const yS = (v: number) => h - ((v - minV) / (maxV - minV)) * h;

  const points = data.map((d, i) => `${xS(i)},${yS(d.body_weight_kg)}`).join(' ');

  // Y-axis ticks (3 values)
  const yTicks = [minV + 1, (minV + maxV) / 2, maxV - 1];

  // X-axis: show first, middle, last
  const xIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
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
          {/* Line */}
          <Polyline points={points} fill="none" stroke={colors.indigo[500]} strokeWidth={2} strokeLinejoin="round" />
          {/* Dots */}
          {data.map((d, i) => (
            <Circle key={i} cx={xS(i)} cy={yS(d.body_weight_kg)} r={3} fill={colors.indigo[500]} />
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
