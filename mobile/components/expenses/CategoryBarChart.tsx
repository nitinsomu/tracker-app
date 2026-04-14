import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface DataItem {
  category: string;
  total: number;
}

interface Props {
  data: DataItem[];
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function CategoryBarChart({ data }: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.total));

  return (
    <View style={styles.container}>
      {data.map(({ category, total }) => {
        const pct = max > 0 ? total / max : 0;
        return (
          <View key={category} style={styles.row}>
            <Text style={styles.label}>{category}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { flex: pct }]} />
              <View style={{ flex: 1 - pct }} />
            </View>
            <Text style={styles.value}>{fmt(Math.round(total))}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 90, fontSize: 12, color: colors.gray[600], textTransform: 'capitalize' },
  barBg: {
    flex: 1, height: 10, borderRadius: 5,
    backgroundColor: colors.gray[100],
    flexDirection: 'row', overflow: 'hidden',
  },
  barFill: { backgroundColor: colors.indigo[500], borderRadius: 5 },
  value: { width: 80, fontSize: 12, color: colors.gray[700], fontWeight: '500', textAlign: 'right' },
});
