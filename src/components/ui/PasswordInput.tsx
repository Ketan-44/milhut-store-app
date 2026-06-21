import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthScroll } from '@/components/ui/AuthLayout';
import { colors, spacing } from '@/constants/theme';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  error?: string;
};

export function PasswordInput({
  label,
  error,
  style,
  onFocus,
  ...props
}: PasswordInputProps) {
  const wrapperRef = useRef<View>(null);
  const authScroll = useAuthScroll();
  const [visible, setVisible] = useState(false);

  function handleFocus(event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    authScroll?.scrollToField(wrapperRef.current);
    onFocus?.(event);
  }

  return (
    <View ref={wrapperRef} style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          secureTextEntry={!visible}
          onFocus={handleFocus}
          {...props}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingRight: spacing.xs,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.error,
  },
});
