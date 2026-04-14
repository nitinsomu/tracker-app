import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePickerField from '../ui/DatePickerField';
import { colors } from '../../constants/colors';
import type { Category, Expense, ExpenseCreate } from '../../types';

interface Props {
  initial?: Expense;
  categories: Category[];
  onSubmit: (data: ExpenseCreate) => Promise<void>;
  onCancel: () => void;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ExpenseForm({ initial, categories, onSubmit, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category ?? (categories[0]?.name ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!amount.trim() || isNaN(parseFloat(amount))) { setError('Enter a valid amount'); return; }
    if (!category) { setError('Select a category'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        date,
        amount: parseFloat(amount),
        category,
        description: description.trim() || undefined,
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
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.gray[400]}
          />
        </View>
      </View>

      <View>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={(v) => setCategory(v)}
            style={styles.picker}
          >
            {categories.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.name} />
            ))}
          </Picker>
        </View>
      </View>

      <View>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          placeholderTextColor={colors.gray[400]}
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
  input: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray[900], backgroundColor: colors.white,
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8,
    backgroundColor: colors.white, overflow: 'hidden',
  },
  picker: { height: 44, color: colors.gray[900] },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  cancelBtn: { borderWidth: 1, borderColor: colors.gray[300], borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  cancelText: { fontSize: 14, color: colors.gray[700] },
  submitBtn: { backgroundColor: colors.indigo[600], borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, minWidth: 72, alignItems: 'center' },
  submitText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  errorBox: { backgroundColor: colors.red[50], borderRadius: 8, padding: 12 },
  errorText: { fontSize: 13, color: colors.red[600] },
});
