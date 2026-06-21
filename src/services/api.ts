import { API_BASE_URL } from '@/constants/config';
import type {
  AuthResponse,
  BatchDetailResponse,
  InventoryItem,
  InventoryQuery,
  LoginPayload,
  PaginatedInventory,
  Product,
  RegisterPayload,
  SalePayload,
  SaleResponse,
  User,
} from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export { TOKEN_KEY, USER_KEY };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function unwrapData<T>(raw: unknown): T {
  if (isRecord(raw) && 'data' in raw && raw.data !== undefined && raw.data !== null) {
    return raw.data as T;
  }

  return raw as T;
}

function extractAuthToken(raw: unknown): string | null {
  if (typeof raw === 'string') {
    return raw;
  }

  if (!isRecord(raw)) {
    return null;
  }

  const fromData = raw.data;
  if (typeof fromData === 'string') {
    return fromData;
  }

  return (
    pickString(raw, 'token') ??
    pickString(raw, 'access_token') ??
    pickString(raw, 'accessToken')
  );
}

function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    role: Number(raw.role ?? 0),
  };
}

function mapProduct(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? ''),
    unit: String(raw.unit ?? ''),
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : undefined,
  };
}

function mapBatchDetail(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    batchNumber: String(raw.batchNumber ?? ''),
    batchType: String(raw.batchType ?? ''),
    expiryDate: typeof raw.expiryDate === 'string' ? raw.expiryDate : undefined,
    sourceName: typeof raw.sourceName === 'string' ? raw.sourceName : undefined,
    remainingQuantity: Number(raw.remainingQuantity ?? 0),
    displayRemainingQuantity:
      raw.displayRemainingQuantity !== undefined
        ? Number(raw.displayRemainingQuantity)
        : undefined,
    quantity: Number(raw.quantity ?? 0),
    displayQuantity:
      raw.displayQuantity !== undefined ? Number(raw.displayQuantity) : undefined,
    isExpired: Boolean(raw.isExpired),
    canSell: Boolean(raw.canSell),
  };
}

function normalizeId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (isRecord(value)) {
    return String(value.id ?? value._id ?? '').trim();
  }

  return '';
}

function mapInventoryItem(raw: Record<string, unknown>) {
  const embeddedProduct = isRecord(raw.product) ? mapProduct(raw.product) : undefined;
  const populatedProductId = isRecord(raw.productId) ? mapProduct(raw.productId) : undefined;
  const productId =
    normalizeId(raw.productId) || populatedProductId?.id || embeddedProduct?.id || '';
  const productName =
    typeof raw.productName === 'string' ? raw.productName.trim() : '';
  const product =
    embeddedProduct ??
    (hasProductName(populatedProductId) ? populatedProductId : undefined) ??
    (productName && productId
      ? { id: productId, name: productName, type: '', unit: '' }
      : undefined);

  return {
    id: String(raw.id ?? raw._id ?? ''),
    batchNumber: String(raw.batchNumber ?? ''),
    productId,
    product,
    quantity: Number(raw.quantity ?? 0),
    remainingQuantity: Number(raw.remainingQuantity ?? 0),
    batchType: String(raw.batchType ?? ''),
    expiryDate: typeof raw.expiryDate === 'string' ? raw.expiryDate : undefined,
    sourceName: typeof raw.sourceName === 'string' ? raw.sourceName : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function buildProductMap(products: Product[]): Map<string, Product> {
  const map = new Map<string, Product>();

  for (const product of products) {
    if (product.id) {
      map.set(product.id, product);
    }
  }

  return map;
}

export async function fetchProductById(
  productId: string,
  token: string,
): Promise<Product | null> {
  try {
    const data = await request<Record<string, unknown>>(
      `/product/${encodeURIComponent(productId)}`,
      {},
      token,
    );
    return mapProduct(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return null;
    }
    throw error;
  }
}

export async function fetchAllProducts(token: string): Promise<Product[]> {
  const authToken = token?.trim();
  if (!authToken) {
    throw new ApiError('Authentication required', 401);
  }

  const items: Product[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const data = await request<Record<string, unknown>>(
      `/product?page=${page}&limit=${limit}`,
      {},
      authToken,
    );

    const pageItems = Array.isArray(data.items) ? data.items : [];
    items.push(
      ...pageItems.map((item) => mapProduct(item as Record<string, unknown>)),
    );

    const meta = isRecord(data.meta) ? data.meta : {};
    const totalPages = Number(meta.totalPages ?? 1);

    if (page >= totalPages) {
      break;
    }

    page += 1;
  }

  return items;
}

function parseBatchLookupResponse(data: Record<string, unknown>): BatchDetailResponse {
  const batchRaw = isRecord(data.batch) ? data.batch : data;
  const productRaw = isRecord(data.product) ? data.product : {};

  return {
    batch: mapBatchDetail(batchRaw),
    product: mapProduct(productRaw),
  };
}

function hasProductName(product?: Product): boolean {
  return Boolean(product?.name?.trim());
}

/** Resolve product names/units; staff can use GET /inventory/:id when /product is forbidden. */
export async function enrichInventoryItems(
  token: string,
  items: InventoryItem[],
): Promise<InventoryItem[]> {
  const authToken = token?.trim();
  if (!authToken || items.length === 0) {
    return items;
  }

  const byProductId = new Map<string, Product>();

  for (const item of items) {
    if (item.product?.id && hasProductName(item.product)) {
      byProductId.set(item.product.id, item.product);
    }
  }

  try {
    const allProducts = await fetchAllProducts(authToken);
    for (const product of allProducts) {
      byProductId.set(product.id, product);
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 403)) {
      throw error;
    }
  }

  const missingProductIds = [
    ...new Set(
      items
        .map((item) => item.productId)
        .filter((id) => id && !hasProductName(byProductId.get(id))),
    ),
  ];

  await Promise.all(
    missingProductIds.map(async (productId) => {
      const product = await fetchProductById(productId, authToken);
      if (product && hasProductName(product)) {
        byProductId.set(product.id, product);
      }
    }),
  );

  const itemsNeedingInventoryLookup = items.filter((item) => {
    const product = item.product ?? byProductId.get(item.productId);
    return !hasProductName(product) && item.id;
  });

  const productByInventoryId = new Map<string, Product>();

  await Promise.all(
    itemsNeedingInventoryLookup.map(async (item) => {
      try {
        const detail = await fetchInventoryById(item.id, authToken);
        if (hasProductName(detail.product)) {
          productByInventoryId.set(item.id, detail.product);
          byProductId.set(detail.product.id, detail.product);
        }
      } catch {
        // Ignore per-row lookup failures.
      }
    }),
  );

  return items.map((item) => {
    const product =
      productByInventoryId.get(item.id) ??
      item.product ??
      byProductId.get(item.productId);

    return product ? { ...item, product } : item;
  });
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const authToken = token?.trim();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof raw.message === 'string'
        ? raw.message
        : Array.isArray(raw.message)
          ? raw.message.join(', ')
          : 'Something went wrong';
    throw new ApiError(message, response.status);
  }

  return unwrapData<T>(raw);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof raw.message === 'string'
        ? raw.message
        : Array.isArray(raw.message)
          ? raw.message.join(', ')
          : 'Something went wrong';
    throw new ApiError(message, response.status);
  }

  const token = extractAuthToken(raw);

  if (!token) {
    throw new ApiError('Invalid login response from server', 500);
  }

  const user = await getProfile(token);
  return { token, user };
}

export async function getProfile(token: string): Promise<User> {
  const data = await request<Record<string, unknown>>('/auth/me', {}, token);
  return mapUser(data);
}

export async function register(
  payload: RegisterPayload,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof raw.message === 'string'
        ? raw.message
        : Array.isArray(raw.message)
          ? raw.message.join(', ')
          : 'Something went wrong';
    throw new ApiError(message, response.status);
  }

  if (typeof raw.message === 'string') {
    return { message: raw.message };
  }

  const data = unwrapData<{ message?: string } | string>(raw);

  if (typeof data === 'string') {
    return { message: data };
  }

  return { message: data.message ?? 'Registration successful' };
}

export async function fetchInventoryById(
  inventoryId: string,
  token: string,
): Promise<BatchDetailResponse> {
  const data = await request<Record<string, unknown>>(
    `/inventory/${encodeURIComponent(inventoryId)}`,
    {},
    token,
  );

  return parseBatchLookupResponse(data);
}

export async function fetchBatchByNumber(
  batchNumber: string,
  token: string,
): Promise<BatchDetailResponse> {
  const data = await request<Record<string, unknown>>(
    `/inventory/batch/${encodeURIComponent(batchNumber)}`,
    {},
    token,
  );

  return parseBatchLookupResponse(data);
}

export async function fetchInventory(
  token: string,
  query: InventoryQuery = {},
): Promise<PaginatedInventory> {
  const authToken = token?.trim();
  if (!authToken) {
    throw new ApiError('Authentication required', 401);
  }

  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const qs = params.toString();
  const data = await request<Record<string, unknown>>(
    `/inventory${qs ? `?${qs}` : ''}`,
    {},
    authToken,
  );

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const metaRaw = isRecord(data.meta) ? data.meta : {};

  return {
    items: itemsRaw.map((item) =>
      mapInventoryItem(item as Record<string, unknown>),
    ),
    meta: {
      total: Number(metaRaw.total ?? 0),
      page: Number(metaRaw.page ?? 1),
      limit: Number(metaRaw.limit ?? 10),
      totalPages: Number(metaRaw.totalPages ?? 1),
    },
  };
}

export async function recordSale(
  payload: SalePayload,
  token: string,
): Promise<SaleResponse> {
  const authToken = token?.trim();
  if (!authToken) {
    throw new ApiError('Authentication required', 401);
  }

  const data = await request<Record<string, unknown>>(
    '/transaction/sale',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    authToken,
  );

  return {
    id: String(data.id ?? data._id ?? ''),
    batchNumber: String(data.batchNumber ?? payload.batchNumber),
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

export function parseBatchNumberFromQr(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      batchNumber?: string;
      batchId?: string;
      id?: string;
    };
    return parsed.batchNumber ?? parsed.batchId ?? parsed.id ?? null;
  } catch {
    // Not JSON — continue with other formats.
  }

  try {
    const url = new URL(trimmed);
    const fromQuery =
      url.searchParams.get('batchNumber') ??
      url.searchParams.get('batchId') ??
      url.searchParams.get('id');
    if (fromQuery) {
      return fromQuery;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    // Not a URL — treat as raw batch number.
  }

  return trimmed;
}
