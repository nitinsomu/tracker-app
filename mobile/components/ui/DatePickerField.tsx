import { useState } from 'react';
import { Platform } from 'react-native';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../constants/colors';

interface Props {
  label: string;
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
}

function toDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DatePickerField({ label, value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      onChange(toDateString(selected));
    }
  }

  if (Platform.OS === 'ios') {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.field} onPress={() => setShowPicker(true)}>
          <Text style={styles.fieldText}>{value}</Text>
        </TouchableOpacity>
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerBox}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={toDate(value)}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={{ backgroundColor: colors.white }}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShowPicker(true)}>
        <Text style={styles.fieldText}>{value}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  fieldText: {
    fontSize: 14,
    color: colors.gray[900],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerBox: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  doneBtn: {
    fontSize: 16,
    color: colors.indigo[600],
    fontWeight: '600',
    paddingHorizontal: 8,
  },
});
