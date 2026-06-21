import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

type DetailRowProps = {
  label: string;
  value: string | number | boolean;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const displayValue =
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: colors.textMuted,
  },
  value: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
});
