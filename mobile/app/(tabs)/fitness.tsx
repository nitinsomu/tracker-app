import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import ConfirmModal from '../../components/ui/ConfirmModal';
import MonthPicker from '../../components/ui/MonthPicker';
import FitnessForm from '../../components/fitness/FitnessForm';
import WeightChart from '../../components/fitness/WeightChart';
import ActivityCalendar from '../../components/fitness/ActivityCalendar';
import { listLogs, createLog, updateLog, deleteLog, getFitnessStats } from '../../db/fitness';
import { colors } from '../../constants/colors';
import type { FitnessLog, FitnessLogCreate, FitnessStats } from '../../types';

function toYearMonth(d: string) { return d.slice(0, 7); }

export default function FitnessScreen() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [stats, setStats] = useState<FitnessStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FitnessLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FitnessLog | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef<InstanceType<typeof ScrollView>>(null);
  const currentMonth = toYearMonth(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  async function load() {
    try {
      const l = await listLogs();
      const s = await getFitnessStats(l);
      setLogs(l);
      setStats(s);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const monthOptions = useMemo(() => {
    const set = new Set(logs.map((l) => toYearMonth(l.date)));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [logs, currentMonth]);

  const monthLogs = useMemo(
    () => logs.filter((l) => toYearMonth(l.date) === selectedMonth),
    [logs, selectedMonth]
  );

  const [year, month] = selectedMonth.split('-').map(Number);

  async function handleCreate(data: FitnessLogCreate) {
    await createLog(data);
    setShowForm(false);
    await load();
  }

  async function handleUpdate(data: FitnessLogCreate) {
    if (!editing) return;
    await updateLog(editing.id, data);
    setEditing(null);
    await load();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteLog(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo[500]} />}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Fitness</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(true); setEditing(null); }}>
            <Text style={styles.addBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Inline form */}
        {(showForm || editing) && (
          <Card>
            <Text style={styles.sectionTitle}>{editing ? 'Edit Log' : 'New Log'}</Text>
            <View style={{ marginTop: 12 }}>
              <FitnessForm
                initial={editing ?? undefined}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </View>
          </Card>
        )}

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <StatCard label="Days logged" value={stats.total_days_logged} />
            <StatCard label="Active" value={stats.active_days} valueColor={colors.green[600]} />
            <StatCard label="Rest" value={stats.rest_days} valueColor={colors.amber[500]} />
          </View>
        )}

        {/* Weight trend chart */}
        {stats && stats.weight_trend.length > 1 && (
          <Card>
            <Text style={styles.sectionTitle}>Weight trend</Text>
            <View style={{ marginTop: 10 }}>
              <WeightChart data={stats.weight_trend} />
            </View>
          </Card>
        )}

        {/* Activity calendar */}
        <Card>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Activity calendar</Text>
            <MonthPicker options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} />
          </View>
          <View style={{ marginTop: 14 }}>
            <ActivityCalendar year={year} month={month} logs={monthLogs} />
          </View>
        </Card>

        {/* Log list for the month */}
        {monthLogs.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Logs — {selectedMonth}</Text>
            <View style={{ marginTop: 10, gap: 1 }}>
              {monthLogs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logDate}>{log.date}</Text>
                    <Text style={styles.logActivities}>
                      {log.activities.length > 0 ? log.activities.join(', ') : '— rest day'}
                    </Text>
                    <Text style={styles.logWeight}>{log.body_weight_kg} kg</Text>
                  </View>
                  <View style={styles.logActions}>
                    <TouchableOpacity onPress={() => { setEditing(log); setShowForm(false); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
                      <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteTarget(log)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete log?"
        message={`Remove the log for ${deleteTarget?.date}?`}
        confirmLabel="Delete"
        confirmDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray[900] },
  addBtn: { backgroundColor: colors.indigo[600], paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[700] },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  errorBox: { backgroundColor: colors.red[50], borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
  logRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  logDate: { fontSize: 13, fontWeight: '600', color: colors.gray[900] },
  logActivities: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  logWeight: { fontSize: 12, color: colors.indigo[500], marginTop: 2 },
  logActions: { flexDirection: 'row', gap: 14 },
  editLink: { fontSize: 13, color: colors.indigo[600] },
  deleteLink: { fontSize: 13, color: colors.red[500] },
});
