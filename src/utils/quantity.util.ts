export type ProductUnit = 'WEIGHT' | 'PIECE';

const GRAMS_PER_KG = 1000;

export function isWeightUnit(unit: ProductUnit | string): boolean {
  return unit === 'WEIGHT';
}

export function toDisplayQuantity(quantity: number, unit: ProductUnit | string): number {
  if (isWeightUnit(unit)) {
    return quantity / GRAMS_PER_KG;
  }

  return quantity;
}

export function getUnitDisplayLabel(unit: ProductUnit | string): string {
  if (isWeightUnit(unit)) {
    return 'kg';
  }

  return 'Piece';
}

export function formatDisplayQuantity(
  quantity: number,
  unit: ProductUnit | string,
): string {
  const display = toDisplayQuantity(quantity, unit);
  return `${display} ${getUnitDisplayLabel(unit)}`;
}
