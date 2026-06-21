import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { ApiError, login } from '@/services/api';
import { colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { token, isLoading, setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && token) {
      router.replace('/dispatch');
    }
  }, [isLoading, token, router]);

  function validate() {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const session = await login({
        email: email.trim(),
        password,
      });
      await setSession(session);
      router.replace('/dispatch');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to sign in. Try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your staff account"
      footer={
        <Text style={styles.footerText}>
          New staff member?{' '}
          <Link href="/register" style={styles.link}>
            Register
          </Link>
        </Text>
      }
    >
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
      <PasswordInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        textContentType="password"
        placeholder="Enter password"
      />
      <Button label="Sign in" loading={loading} onPress={handleLogin} />
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
