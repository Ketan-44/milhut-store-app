import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/context/AuthContext';
import { SPLASH_DURATION_MS } from '@/constants/config';
import { colors, spacing } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function SplashScreenRoute() {
  const router = useRouter();
  const { token, isLoading } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      await SplashScreen.hideAsync();
      await new Promise((resolve) => setTimeout(resolve, SPLASH_DURATION_MS));

      if (!mounted || isLoading) {
        return;
      }

      if (token) {
        router.replace('/dispatch');
      } else {
        router.replace('/login');
      }
    }

    if (!isLoading) {
      prepare();
    }

    return () => {
      mounted = false;
    };
  }, [isLoading, token, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icons/newlogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
