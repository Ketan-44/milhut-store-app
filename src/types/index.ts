export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: number;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type RegisterPayload = {
  name?: string;
  email: string;
  phone: string;
  password: string;
  role: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type Product = {
  id: string;
  name: string;
  type: string;
  unit: string;
  isActive?: boolean;
};

export type BatchDetail = {
  id: string;
  batchNumber: string;
  batchType: string;
  expiryDate?: string;
  sourceName?: string;
  remainingQuantity: number;
  displayRemainingQuantity?: number;
  quantity: number;
  displayQuantity?: number;
  isExpired: boolean;
  canSell: boolean;
};

export type BatchDetailResponse = {
  batch: BatchDetail;
  product: Product;
};

export type InventoryItem = {
  id: string;
  batchNumber: string;
  productId: string;
  product?: Product;
  quantity: number;
  remainingQuantity: number;
  batchType: string;
  expiryDate?: string;
  sourceName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedInventory = {
  items: InventoryItem[];
  meta: PaginationMeta;
};

export type InventoryQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

/** Sale API accepts batchNumber only — do not send batch id. */
export type SalePayload = {
  batchNumber: string;
  quantity: number;
  remarks?: string;
};

export type SaleResponse = {
  id: string;
  batchNumber: string;
  message?: string;
};
