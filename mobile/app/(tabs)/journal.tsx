import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/ui/Card';
import ConfirmModal from '../../components/ui/ConfirmModal';
import JournalForm from '../../components/journal/JournalForm';
import JournalCard from '../../components/journal/JournalCard';
import { listEntries, createEntry, updateEntry, deleteEntry } from '../../db/journal';
import { colors } from '../../constants/colors';
import type { JournalEntry, JournalEntryCreate } from '../../types';

export default function JournalScreen() {
  const scrollRef = useRef<InstanceType<typeof ScrollView>>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setEntries(await listEntries());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleCreate(data: JournalEntryCreate) {
    await createEntry(data);
    setShowForm(false);
    await load();
  }

  async function handleUpdate(data: JournalEntryCreate) {
    if (!editing) return;
    await updateEntry(editing.id, data);
    setEditing(null);
    await load();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget.id);
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
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Journal</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(true); setEditing(null); }}>
            <Text style={styles.addBtnText}>+ New entry</Text>
          </TouchableOpacity>
        </View>

        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Form */}
        {(showForm || editing) && (
          <Card>
            <Text style={styles.sectionTitle}>{editing ? 'Edit entry' : 'New entry'}</Text>
            <View style={{ marginTop: 12 }}>
              <JournalForm
                initial={editing ?? undefined}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </View>
          </Card>
        )}

        {/* Entries list */}
        {entries.length === 0 && !showForm && (
          <Card>
            <Text style={styles.emptyText}>No entries yet. Write your first one!</Text>
          </Card>
        )}

        {entries.map((entry) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            onEdit={() => { setEditing(entry); setShowForm(false); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
            onDelete={() => setDeleteTarget(entry)}
          />
        ))}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete entry?"
        message={`Delete the entry from ${deleteTarget?.date}?`}
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
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray[900] },
  addBtn: { backgroundColor: colors.indigo[600], paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[700] },
  errorBox: { backgroundColor: colors.red[50], borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
  emptyText: { fontSize: 14, color: colors.gray[500] },
});
