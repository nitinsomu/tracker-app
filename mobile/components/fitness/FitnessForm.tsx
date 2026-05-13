import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import DatePickerField from '../ui/DatePickerField';
import { colors } from '../../constants/colors';
import type { FitnessLog, FitnessLogCreate } from '../../types';

interface Props {
  initial?: FitnessLog;
  onSubmit: (data: FitnessLogCreate) => Promise<void>;
  onCancel: () => void;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function FitnessForm({ initial, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [weight, setWeight] = useState(String(initial?.body_weight_kg ?? ''));
  const [activities, setActivities] = useState(initial?.activities.join(', ') ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!weight.trim() || isNaN(parseFloat(weight))) { setError('Enter a valid weight'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        date,
        body_weight_kg: parseFloat(weight),
        activities: activities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.form}>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.half}>
          <DatePickerField label="Date" value={date} onChange={setDate} />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="70.0"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      <View>
        <Text style={styles.label}>
          Activities{' '}
          <Text style={styles.hint}>(comma-separated, leave empty for rest day)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={activities}
          onChangeText={setActivities}
          placeholder="Running, Push-ups"
          placeholderTextColor={colors.gray[400]}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 6 },
  hint: { fontSize: 12, color: colors.gray[400], fontWeight: '400' },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  cancelText: { fontSize: 14, color: colors.gray[700] },
  submitBtn: {
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  submitText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  errorBox: {
    backgroundColor: colors.red[50],
    borderRadius: 8,
    padding: 12,
  },
  errorText: { fontSize: 13, color: colors.red[600] },
});
