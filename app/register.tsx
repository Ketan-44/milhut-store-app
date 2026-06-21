import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { STAFF_ROLE } from '@/constants/config';
import { ApiError, register } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

type RegisterErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && token) {
      router.replace('/dispatch');
    }
  }, [isLoading, token, router]);

  function validate() {
    const nextErrors: RegisterErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!phone.trim()) {
      nextErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      nextErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: STAFF_ROLE,
      });

      Alert.alert(
        'Registration successful',
        'Your staff account has been created. Please sign in.',
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to register. Try again.';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Register as Milhut Store staff"
      footer={
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </Text>
      }
    >
      <Input
        label="Name (optional)"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        placeholder="Your name"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        placeholder="9898989898"
        maxLength={10}
      />
      <PasswordInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        textContentType="newPassword"
        placeholder="Create password"
      />
      <PasswordInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        textContentType="newPassword"
        placeholder="Repeat password"
      />
      <Button label="Register as staff" loading={loading} onPress={handleRegister} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
