import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { exportBackup, importBackup } from '../services/backup';
import { scheduleDailyReminder, cancelReminder, isReminderScheduled } from '../services/notifications';
import { colors } from '../constants/colors';

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 20, 0)); // default 8:00 PM
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  useEffect(() => {
    isReminderScheduled().then(setReminderEnabled).catch(() => {});
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    Alert.alert(
      'Import backup',
      'This will REPLACE all current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const { counts } = await importBackup();
              Alert.alert(
                'Import successful',
                `Restored:\n• ${counts.fitness_logs} fitness logs\n• ${counts.expenses} expenses\n• ${counts.journal_entries} journal entries\n• ${counts.categories} categories`
              );
            } catch (err) {
              Alert.alert('Import failed', err instanceof Error ? err.message : 'Unknown error');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  }

  async function handleReminderToggle(enabled: boolean) {
    setReminderLoading(true);
    try {
      if (enabled) {
        await scheduleDailyReminder(reminderTime.getHours(), reminderTime.getMinutes());
        setReminderEnabled(true);
      } else {
        await cancelReminder();
        setReminderEnabled(false);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update reminder');
    } finally {
      setReminderLoading(false);
    }
  }

  async function handleTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    setReminderTime(selected);
    if (reminderEnabled) {
      try {
        await scheduleDailyReminder(selected.getHours(), selected.getMinutes());
      } catch {}
    }
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Backup section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>
          <Text style={styles.sectionSubtitle}>
            Your data is stored locally on this device. Export a backup to Google Drive or iCloud before clearing the app.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleExport} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Export backup (JSON)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleImport} disabled={importing}>
            {importing ? (
              <ActivityIndicator color={colors.indigo[600]} size="small" />
            ) : (
              <Text style={styles.secondaryBtnText}>Import backup</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Reminder section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reminder</Text>
          <Text style={styles.sectionSubtitle}>
            Get a daily push notification to log your fitness, expenses, and journal.
          </Text>

          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Enable reminder</Text>
            {reminderLoading ? (
              <ActivityIndicator color={colors.indigo[500]} size="small" />
            ) : (
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: colors.gray[300], true: colors.indigo[500] }}
                thumbColor={colors.white}
              />
            )}
          </View>

          {reminderEnabled && (
            <View style={styles.timeRow}>
              <Text style={styles.reminderLabel}>Reminder time</Text>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timeBtnText}>{formatTime(reminderTime)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={styles.divider} />

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Tracker — personal fitness, expense & journal app.</Text>
          <Text style={styles.aboutText}>All data is stored locally on your device.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  content: { padding: 20, gap: 0, paddingBottom: 40 },
  section: { gap: 12, paddingVertical: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  sectionSubtitle: { fontSize: 13, color: colors.gray[500], lineHeight: 19 },
  primaryBtn: {
    backgroundColor: colors.indigo[600], borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, color: colors.white, fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: colors.indigo[600], borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', backgroundColor: colors.white,
  },
  secondaryBtnText: { fontSize: 15, color: colors.indigo[600], fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.gray[200], marginVertical: 20 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLabel: { fontSize: 15, color: colors.gray[700] },
  timeBtn: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.white,
  },
  timeBtnText: { fontSize: 14, color: colors.indigo[600], fontWeight: '500' },
  aboutText: { fontSize: 13, color: colors.gray[500] },
});
