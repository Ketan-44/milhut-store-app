import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/theme';

export default function DispatchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Button label="Scan QR" onPress={() => router.push('/dispatch/scan')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
