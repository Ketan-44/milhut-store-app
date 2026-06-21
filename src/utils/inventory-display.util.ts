import type { InventoryItem, Product } from '@/types';
import {
  formatDisplayQuantity,
  getUnitDisplayLabel,
  isWeightUnit,
  toDisplayQuantity,
  type ProductUnit,
} from '@/utils/quantity.util';

export type InventoryStatus = 'Available' | 'Expired' | 'Depleted';

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resolveProduct(
  item: InventoryItem,
  products: Map<string, Product>,
): Product | undefined {
  return item.product ?? products.get(item.productId);
}

function inferUnit(item: InventoryItem): ProductUnit {
  const batchType = item.batchType.toUpperCase();

  if (batchType === 'RAW') {
    return 'WEIGHT';
  }

  if (batchType === 'FINISHED') {
    return 'PIECE';
  }

  return item.quantity >= 100 ? 'WEIGHT' : 'PIECE';
}

function resolveUnit(item: InventoryItem, products: Map<string, Product>): ProductUnit {
  const product = resolveProduct(item, products);
  const unit = product?.unit;

  if (unit === 'WEIGHT' || unit === 'PIECE') {
    return unit;
  }

  return inferUnit(item);
}

function formatDisplayNumber(value: number, unit: ProductUnit): string {
  if (isWeightUnit(unit)) {
    return Number(value.toFixed(3)).toString();
  }

  return String(value);
}

export function getProductName(
  item: InventoryItem,
  products: Map<string, Product>,
): string {
  const product = resolveProduct(item, products);
  return product?.name?.trim() || '—';
}

export function getDisplayQuantity(
  quantity: number,
  item: InventoryItem,
  products: Map<string, Product>,
): string {
  const unit = resolveUnit(item, products);
  const display = toDisplayQuantity(quantity, unit);

  return `${formatDisplayNumber(display, unit)} ${getUnitDisplayLabel(unit)}`;
}

export function formatExpiryDate(expiryDate?: string): string {
  if (!expiryDate) {
    return '—';
  }

  const parsed = new Date(expiryDate);
  if (Number.isNaN(parsed.getTime())) {
    return expiryDate;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) {
    return false;
  }

  return new Date(expiryDate).getTime() < Date.now();
}

export function isDepleted(batch: Pick<InventoryItem, 'remainingQuantity'>): boolean {
  return batch.remainingQuantity <= 0;
}

export function getInventoryStatus(batch: InventoryItem): InventoryStatus {
  if (batch.expiryDate && isExpired(batch.expiryDate)) {
    return 'Expired';
  }

  if (isDepleted(batch)) {
    return 'Depleted';
  }

  return 'Available';
}

export function filterVisibleInventoryItems(
  items: InventoryItem[],
  search: string,
): InventoryItem[] {
  if (search.trim()) {
    return items;
  }

  return items.filter((item) => item.remainingQuantity > 0);
}

// Re-export for tests or reuse outside inventory rows.
export { formatDisplayQuantity };
