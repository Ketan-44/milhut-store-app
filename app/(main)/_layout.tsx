import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/theme';

export default function MainLayout() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
