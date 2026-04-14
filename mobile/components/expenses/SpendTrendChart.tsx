import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/colors';

interface DataPoint {
  label: string;
  total: number;
}

interface Props {
  data: DataPoint[];
}

export default function SpendTrendChart({ data }: Props) {
  const { width } = useWindowDimensions();
  if (data.length < 2) return null;

  const chartWidth = width - 64;
  const chartHeight = 160;
  const pad = { top: 8, right: 8, bottom: 28, left: 52 };
  const w = chartWidth - pad.left - pad.right;
  const h = chartHeight - pad.top - pad.bottom;

  const vals = data.map((d) => d.total);
  const minV = 0;
  const maxV = Math.ceil(Math.max(...vals) * 1.1);

  const xS = (i: number) => (i / (data.length - 1)) * w;
  const yS = (v: number) => h - (v / maxV) * h;

  const points = data.map((d, i) => `${xS(i)},${yS(d.total)}`).join(' ');

  const yTicks = [0, Math.round(maxV / 2), maxV];
  const xIndices = data.length <= 4
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  function fmtY(v: number) {
    if (v >= 100000) return `₹${(v / 1000).toFixed(0)}k`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${v}`;
  }

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight}>
        <G transform={`translate(${pad.left},${pad.top})`}>
          {yTicks.map((v, i) => (
            <Line key={i} x1={0} y1={yS(v)} x2={w} y2={yS(v)} stroke={colors.gray[100]} strokeWidth={1} />
          ))}
          {yTicks.map((v, i) => (
            <SvgText key={i} x={-6} y={yS(v) + 4} textAnchor="end" fontSize={10} fill={colors.gray[400]}>
              {fmtY(v)}
            </SvgText>
          ))}
          <Polyline points={points} fill="none" stroke={colors.indigo[500]} strokeWidth={2} strokeLinejoin="round" />
          {data.map((d, i) => (
            <Circle key={i} cx={xS(i)} cy={yS(d.total)} r={3} fill={colors.indigo[500]} />
          ))}
          {xIndices.map((idx) => (
            <SvgText key={idx} x={xS(idx)} y={h + 20} textAnchor="middle" fontSize={10} fill={colors.gray[400]}>
              {data[idx].label}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}
