import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmDestructive?: boolean;
}

export default function ConfirmModal({
  visible,
  title = 'Confirm',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  confirmDestructive = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, confirmDestructive && styles.destructiveBtn]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 20,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.indigo[600],
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  destructiveBtn: {
    backgroundColor: colors.red[600],
  },
  confirmText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
});
