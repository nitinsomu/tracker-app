import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import type { FitnessLog } from '../../types';

interface Props {
  year: number;
  month: number; // 1-based
  logs: FitnessLog[];
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityCalendar({ year, month, logs }: Props) {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  const logByDate = useMemo(() => {
    const map: Record<string, FitnessLog> = {};
    logs.forEach((l) => { map[l.date] = l; });
    return map;
  }, [logs]);

  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      l.activities.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDow });

  function dayStyle(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = logByDate[dateStr];

    if (!log) return styles.dayEmpty;
    if (log.activities.length === 0) {
      return activeActivity ? styles.dayDimmed : styles.dayRest;
    }
    if (activeActivity) {
      return log.activities.includes(activeActivity) ? styles.dayHighlighted : styles.dayDimmed;
    }
    return styles.dayActive;
  }

  function dayTextStyle(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = logByDate[dateStr];
    if (!log) return styles.dayTextEmpty;
    if (log.activities.length === 0) return activeActivity ? styles.dayTextDimmed : styles.dayTextRest;
    if (activeActivity) return log.activities.includes(activeActivity) ? styles.dayTextHighlighted : styles.dayTextDimmed;
    return styles.dayTextActive;
  }

  return (
    <View style={styles.container}>
      {/* Activity chips */}
      {activityCounts.length > 0 && (
        <View>
          <Text style={styles.hintText}>Tap an activity to highlight days</Text>
          <View style={styles.chips}>
            {activityCounts.map(([activity, count]) => (
              <TouchableOpacity
                key={activity}
                style={[styles.chip, activeActivity === activity && styles.chipActive]}
                onPress={() => setActiveActivity(activeActivity === activity ? null : activity)}
              >
                <Text style={[styles.chipText, activeActivity === activity && styles.chipTextActive]}>
                  {activity} <Text style={styles.chipCount}>{count}×</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {activityCounts.length === 0 && (
        <Text style={styles.emptyText}>No activities logged this month.</Text>
      )}

      {/* Calendar grid */}
      <View style={styles.grid}>
        {DOW_LABELS.map((d) => (
          <View key={d} style={styles.cell}>
            <Text style={styles.dowLabel}>{d}</Text>
          </View>
        ))}
        {blanks.map((_, i) => <View key={`b${i}`} style={styles.cell} />)}
        {days.map((day) => (
          <View key={day} style={styles.cell}>
            <View style={[styles.dayCell, dayStyle(day)]}>
              <Text style={dayTextStyle(day)}>{day}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.indigo[100] }]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.amber[100] }]} />
          <Text style={styles.legendText}>Rest</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.gray[50], borderWidth: 1, borderColor: colors.gray[200] }]} />
          <Text style={styles.legendText}>No log</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  hintText: { fontSize: 11, color: colors.gray[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.indigo[500], borderColor: colors.indigo[500] },
  chipText: { fontSize: 13, color: colors.gray[700] },
  chipTextActive: { color: colors.white },
  chipCount: { fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.gray[400] },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayCell: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  dayEmpty: { backgroundColor: colors.gray[50] },
  dayActive: { backgroundColor: colors.indigo[100] },
  dayRest: { backgroundColor: colors.amber[100] },
  dayHighlighted: { backgroundColor: colors.indigo[500] },
  dayDimmed: { backgroundColor: colors.gray[100] },
  dowLabel: { fontSize: 10, color: colors.gray[400], textAlign: 'center' },
  dayTextEmpty: { fontSize: 12, color: colors.gray[300] },
  dayTextActive: { fontSize: 12, color: colors.indigo[700], fontWeight: '500' },
  dayTextRest: { fontSize: 12, color: colors.amber[700], fontWeight: '500' },
  dayTextHighlighted: { fontSize: 12, color: colors.white, fontWeight: '600' },
  dayTextDimmed: { fontSize: 12, color: colors.gray[400] },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: colors.gray[400] },
});
