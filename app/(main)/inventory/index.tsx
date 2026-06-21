import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { ApiError, buildProductMap, enrichInventoryItems, fetchInventory } from '@/services/api';
import type { InventoryItem, Product } from '@/types';
import {
  filterVisibleInventoryItems,
  getDisplayQuantity,
  getInventoryStatus,
  getProductName,
  formatExpiryDate,
  toTitleCase,
  type InventoryStatus,
} from '@/utils/inventory-display.util';
import { colors, spacing } from '@/constants/theme';

type SortField =
  | 'batchNumber'
  | 'batchType'
  | 'quantity'
  | 'remainingQuantity'
  | 'sourceName'
  | 'expiryDate'
  | 'createdAt';

type SortOrder = 'ASC' | 'DESC';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const TABLE_MIN_WIDTH = 980;

const COLUMNS: {
  key: SortField | 'product' | 'status';
  label: string;
  width: number;
  sortable: boolean;
  sortKey?: SortField;
}[] = [
  { key: 'batchNumber', label: 'Batch No.', width: 175, sortable: true, sortKey: 'batchNumber' },
  { key: 'product', label: 'Product', width: 170, sortable: false },
  { key: 'batchType', label: 'Type', width: 90, sortable: true, sortKey: 'batchType' },
  { key: 'quantity', label: 'Quantity', width: 110, sortable: true, sortKey: 'quantity' },
  {
    key: 'remainingQuantity',
    label: 'Remaining',
    width: 110,
    sortable: true,
    sortKey: 'remainingQuantity',
  },
  { key: 'sourceName', label: 'Source', width: 90, sortable: true, sortKey: 'sourceName' },
  { key: 'expiryDate', label: 'Expiry', width: 115, sortable: true, sortKey: 'expiryDate' },
  { key: 'status', label: 'Status', width: 110, sortable: false },
];

function StatusBadge({ status }: { status: InventoryStatus }) {
  const style =
    status === 'Available'
      ? styles.badgeAvailable
      : status === 'Expired'
        ? styles.badgeExpired
        : styles.badgeDepleted;

  const textStyle =
    status === 'Available'
      ? styles.badgeTextAvailable
      : status === 'Expired'
        ? styles.badgeTextExpired
        : styles.badgeTextDepleted;

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>{status}</Text>
    </View>
  );
}

function TableHeader({
  sortBy,
  sortOrder,
  onSort,
}: {
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSort: (field: SortField) => void;
}) {
  return (
    <View style={[styles.row, styles.headerRow]}>
      {COLUMNS.map((column) => {
        const active = column.sortKey === sortBy;
        return (
          <Pressable
            key={column.key}
            style={[styles.cellWrap, { width: column.width }]}
            disabled={!column.sortable || !column.sortKey}
            onPress={() => column.sortKey && onSort(column.sortKey)}
          >
            <View style={styles.headerCellInner}>
              <Text style={styles.headerCell}>{column.label}</Text>
              {column.sortable && column.sortKey ? (
                <View style={styles.sortIcons}>
                  <Ionicons
                    name="caret-up"
                    size={10}
                    color={active && sortOrder === 'ASC' ? '#fff' : 'rgba(255,255,255,0.45)'}
                  />
                  <Ionicons
                    name="caret-down"
                    size={10}
                    color={active && sortOrder === 'DESC' ? '#fff' : 'rgba(255,255,255,0.45)'}
                  />
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function InventoryRow({
  item,
  products,
}: {
  item: InventoryItem;
  products: Map<string, Product>;
}) {
  const status = getInventoryStatus(item);

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, { width: COLUMNS[0].width }]} numberOfLines={2}>
        {item.batchNumber}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[1].width }]} numberOfLines={2}>
        {toTitleCase(getProductName(item, products))}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[2].width }]}>
        {toTitleCase(item.batchType)}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[3].width }]}>
        {getDisplayQuantity(item.quantity, item, products)}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[4].width }]}>
        {getDisplayQuantity(item.remainingQuantity, item, products)}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[5].width }]} numberOfLines={1}>
        {item.sourceName || '—'}
      </Text>
      <Text style={[styles.cell, { width: COLUMNS[6].width }]}>
        {formatExpiryDate(item.expiryDate)}
      </Text>
      <View style={[styles.cellWrap, { width: COLUMNS[7].width }]}>
        <StatusBadge status={status} />
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const { token, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const loadScreenData = useCallback(async () => {
    const authToken = token?.trim();
    if (!authToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchInventory(authToken, {
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });

      const visibleItems = filterVisibleInventoryItems(result.items, debouncedSearch);
      const enrichedItems = await enrichInventoryItems(authToken, visibleItems);
      const productList = enrichedItems
        .map((item) => item.product)
        .filter((product): product is NonNullable<typeof product> => Boolean(product?.id));

      setProducts(buildProductMap(productList));
      setItems(enrichedItems);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load inventory.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, sortBy, sortOrder, token]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadScreenData();
  }, [authLoading, loadScreenData]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setPage(1);
  }

  const pageLabel = useMemo(
    () => `Page ${page} of ${totalPages} (${total} items)`,
    [page, total, totalPages],
  );

  const emptyMessage = debouncedSearch.trim()
    ? 'No inventory batches match your search.'
    : 'No inventory batches found.';

  const tableBody = loading ? (
    <View style={styles.loadingBox}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>Loading inventory...</Text>
    </View>
  ) : error ? (
    <View style={styles.loadingBox}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  ) : items.length === 0 ? (
    <View style={styles.loadingBox}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  ) : (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <InventoryRow item={item} products={products} />}
      scrollEnabled
      nestedScrollEnabled
      showsVerticalScrollIndicator
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.search}
          placeholder="Search by batch number, source, or product name"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        persistentScrollbar
        nestedScrollEnabled
        style={styles.tableScroll}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={[styles.table, { minWidth: TABLE_MIN_WIDTH }]}>
          <TableHeader sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
          {tableBody}
        </View>
      </ScrollView>

      <View style={styles.pagination}>
        <Pressable
          style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
          disabled={page <= 1 || loading}
          onPress={() => setPage((current) => Math.max(1, current - 1))}
        >
          <Ionicons name="chevron-back" size={20} color={page <= 1 ? colors.border : colors.text} />
        </Pressable>
        <Text style={styles.pageLabel}>{pageLabel}</Text>
        <Pressable
          style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
          disabled={page >= totalPages || loading}
          onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={page >= totalPages ? colors.border : colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  tableScroll: {
    flex: 1,
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  table: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerRow: {
    backgroundColor: colors.primary,
  },
  headerCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sortIcons: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  cellWrap: {
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  cell: {
    fontSize: 13,
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAvailable: {
    backgroundColor: '#dcfce7',
  },
  badgeExpired: {
    backgroundColor: '#fee2e2',
  },
  badgeDepleted: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextAvailable: {
    color: colors.success,
  },
  badgeTextExpired: {
    color: colors.error,
  },
  badgeTextDepleted: {
    color: colors.textMuted,
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: TABLE_MIN_WIDTH,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pageButton: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
