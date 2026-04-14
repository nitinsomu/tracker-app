import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  children: React.ReactNode;
  style?: object;
}

export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 16,
  },
});
