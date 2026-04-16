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
          <View key={category} style={styles.item}>
            <View style={styles.labelRow}>
              <Text style={styles.label} numberOfLines={1}>{category}</Text>
              <Text style={styles.value}>{fmt(Math.round(total))}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { flex: pct }]} />
              <View style={{ flex: 1 - pct }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  item: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: colors.gray[600], textTransform: 'capitalize', flex: 1, marginRight: 8 },
  barBg: {
    height: 10, borderRadius: 5,
    backgroundColor: colors.gray[100],
    flexDirection: 'row', overflow: 'hidden',
  },
  barFill: { backgroundColor: colors.indigo[500], borderRadius: 5 },
  value: { fontSize: 12, color: colors.gray[700], fontWeight: '500' },
});
