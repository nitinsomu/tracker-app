import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  label: string;
  value: string | number;
  valueColor?: string;
}

export default function StatCard({ label, value, valueColor = colors.gray[900] }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 12,
  },
  label: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
  },
});
