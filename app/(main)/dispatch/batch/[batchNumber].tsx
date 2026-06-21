import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { DetailRow } from '@/components/ui/DetailRow';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { ApiError, fetchBatchByNumber, recordSale } from '@/services/api';
import type { BatchDetailResponse } from '@/types';
import { colors, spacing } from '@/constants/theme';

export default function BatchDetailScreen() {
  const router = useRouter();
  const { batchNumber } = useLocalSearchParams<{ batchNumber: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [detail, setDetail] = useState<BatchDetailResponse | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [quantityError, setQuantityError] = useState<string | undefined>();

  const loadBatch = useCallback(async () => {
    if (!token || !batchNumber) {
      return;
    }

    setLoading(true);
    try {
      const data = await fetchBatchByNumber(decodeURIComponent(batchNumber), token);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load batch details.';
      Alert.alert('Error', message, [
        { text: 'Back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [batchNumber, router, token]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  function validateQuantity(remaining: number) {
    const parsed = Number(quantity);

    if (!quantity.trim() || Number.isNaN(parsed)) {
      setQuantityError('Enter a valid quantity');
      return null;
    }

    if (parsed < 1) {
      setQuantityError('Quantity must be at least 1');
      return null;
    }

    if (!Number.isInteger(parsed)) {
      setQuantityError('Quantity must be a whole number');
      return null;
    }

    if (parsed > remaining) {
      setQuantityError(`Only ${remaining} remaining in this batch`);
      return null;
    }

    setQuantityError(undefined);
    return parsed;
  }

  async function handleSale() {
    if (!detail || !token) {
      return;
    }

    const remaining =
      detail.batch.displayRemainingQuantity ?? detail.batch.remainingQuantity;

    if (!detail.batch.canSell) {
      Alert.alert('Cannot sell', 'This batch is not available for sale.');
      return;
    }

    const parsedQuantity = validateQuantity(remaining);
    if (parsedQuantity === null) {
      return;
    }

    setSelling(true);
    try {
      await recordSale(
        {
          batchNumber: detail.batch.batchNumber,
          quantity: parsedQuantity,
        },
        token,
      );

      Alert.alert('Success', 'Sale recorded successfully.');
      setQuantity('1');
      await loadBatch();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to record sale.';
      Alert.alert('Sale failed', message);
    } finally {
      setSelling(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading batch…</Text>
      </View>
    );
  }

  if (!detail) {
    return null;
  }

  const { batch, product } = detail;
  const remaining = batch.displayRemainingQuantity ?? batch.remainingQuantity;
  const canSell = batch.canSell && remaining > 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Batch Details</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batch</Text>
        <DetailRow label="Batch number" value={batch.batchNumber} />
        <DetailRow label="Type" value={batch.batchType} />
        <DetailRow label="Quantity" value={batch.displayQuantity ?? batch.quantity} />
        <DetailRow label="Remaining" value={remaining} />
        <DetailRow label="Expiry date" value={batch.expiryDate ?? '—'} />
        <DetailRow label="Source" value={batch.sourceName ?? '—'} />
        <DetailRow label="Expired" value={batch.isExpired} />
        <DetailRow label="Can sell" value={batch.canSell} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product</Text>
        <DetailRow label="Name" value={product.name} />
        <DetailRow label="Type" value={product.type} />
        <DetailRow label="Unit" value={product.unit} />
        <DetailRow
          label="Active"
          value={product.isActive !== undefined ? product.isActive : '—'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record sale</Text>
        <Input
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          error={quantityError}
          keyboardType="number-pad"
          placeholder="1"
          editable={canSell && !selling}
        />
        <Button
          label="Sale"
          loading={selling}
          disabled={!canSell}
          onPress={handleSale}
        />
        {!canSell ? (
          <Text style={styles.disabledHint}>
            This batch cannot be sold (expired, no stock, or not eligible).
          </Text>
        ) : null}
      </View>

      <Button
        label="Scan another"
        variant="secondary"
        onPress={() => router.replace('/dispatch/scan')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  disabledHint: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
