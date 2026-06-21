import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/constants/theme';

type AppShellProps = {
  children: ReactNode;
};

const MENU_ITEMS = [
  { label: 'Dispatch item', href: '/dispatch', icon: 'qr-code-outline' as const },
  { label: 'Inventory', href: '/inventory', icon: 'list-outline' as const },
];

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearSession } = useAuth();
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: open ? 0 : -280,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, slideAnim]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href as never);
  }

  async function handleLogout() {
    setOpen(false);
    await clearSession();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          onPress={() => setOpen(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Milhut Store</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>{children}</View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <Text style={styles.sidebarUser}>{user?.name ?? user?.email}</Text>
            </View>

            {MENU_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Pressable
                  key={item.href}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => navigate(item.href)}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={active ? colors.primary : colors.text}
                  />
                  <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable style={styles.logoutItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 40,
  },
  headerSpacer: {
    width: 0,
  },
  content: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sidebarHeader: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sidebarUser: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  menuItemActive: {
    backgroundColor: '#eef3ef',
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
});
