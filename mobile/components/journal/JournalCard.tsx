import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import type { JournalEntry } from '../../types';

interface Props {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export default function JournalCard({ entry, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggle() {
    setExpanded((v) => !v);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{entry.date}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {entry.content.slice(0, 120)}{entry.content.length > 120 ? '…' : ''}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onEdit(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteLink}>Delete</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.content}>{entry.content}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  date: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  preview: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editLink: { fontSize: 13, color: colors.indigo[600] },
  deleteLink: { fontSize: 13, color: colors.red[500] },
  chevron: { fontSize: 10, color: colors.gray[400] },
  body: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    padding: 14,
    paddingTop: 12,
  },
  content: { fontSize: 14, color: colors.gray[700], lineHeight: 22 },
});
