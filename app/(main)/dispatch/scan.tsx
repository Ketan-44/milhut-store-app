import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { parseBatchNumberFromQr } from '@/services/api';
import { colors, spacing } from '@/constants/theme';

export default function DispatchScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) {
        return;
      }

      const batchNumber = parseBatchNumberFromQr(data);

      if (!batchNumber) {
        Alert.alert('Invalid QR', 'Could not read a batch number from this code.');
        return;
      }

      setScanned(true);
      router.replace(`/dispatch/batch/${encodeURIComponent(batchNumber)}`);
    },
    [router, scanned],
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is required to scan batch QR codes.</Text>
        <Button label="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>Align the QR code within the frame</Text>
        {scanned ? (
          <Button label="Scan again" onPress={() => setScanned(false)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  hint: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  message: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
