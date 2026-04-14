import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import DatePickerField from '../ui/DatePickerField';
import { colors } from '../../constants/colors';
import type { JournalEntry, JournalEntryCreate } from '../../types';

interface Props {
  initial?: JournalEntry;
  onSubmit: (data: JournalEntryCreate) => Promise<void>;
  onCancel: () => void;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function JournalForm({ initial, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) { setError('Write something first'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ date, content: content.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.form}>
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <DatePickerField label="Date" value={date} onChange={setDate} />

        <View>
          <Text style={styles.label}>Entry</Text>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.gray[400]}
            textAlignVertical="top"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 6 },
  textarea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    backgroundColor: colors.white,
    minHeight: 140,
    lineHeight: 22,
  },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  cancelText: { fontSize: 14, color: colors.gray[700] },
  submitBtn: { backgroundColor: colors.indigo[600], borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, minWidth: 72, alignItems: 'center' },
  submitText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  errorBox: { backgroundColor: colors.red[50], borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
});
