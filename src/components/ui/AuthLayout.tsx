import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

type AuthScrollContextValue = {
  scrollToField: (fieldRef: View | null) => void;
};

const AuthScrollContext = createContext<AuthScrollContextValue | null>(null);

export function useAuthScroll() {
  return useContext(AuthScrollContext);
}

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const scrollToField = useCallback((fieldRef: View | null) => {
    if (!fieldRef || !scrollRef.current || !contentRef.current) {
      return;
    }

    // Wait for keyboard animation before scrolling.
    setTimeout(() => {
      fieldRef.measureLayout(
        contentRef.current as View,
        (_x, y, _width, height) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y + height - 160),
            animated: true,
          });
        },
        () => {
          scrollRef.current?.scrollToEnd({ animated: true });
        },
      );
    }, Platform.OS === 'ios' ? 250 : 100);
  }, []);

  return (
    <AuthScrollContext.Provider value={{ scrollToField }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <View ref={contentRef}>
              <View style={styles.header}>
                <Image
                  source={require('../../../assets/icons/newlogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              <View style={styles.form}>{children}</View>

              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthScrollContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
