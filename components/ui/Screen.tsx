import type { ReactNode } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

interface Props {
  title: string;
  subtitle?: string;
  scrollable?: boolean;
  children: ReactNode;
}

export function Screen({ title, subtitle, scrollable, children }: Props) {
  const insets = useSafeAreaInsets();
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? { contentContainerStyle: [styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 24 }] }
    : { style: [styles.content, { flex: 1, paddingBottom: Math.max(insets.bottom, 24) }] };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 24 : insets.top + 12 }]}>
        <View style={styles.badge}>
          <Image
            source={require('@/assets/images/logo-don-ramon.jpg')}
            style={styles.badgeImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerTexto}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Container {...(containerProps as object)}>{children}</Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.grisClaro },
  header: {
    backgroundColor: COLORS.negro,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.crema,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.dorado,
  },
  badgeImg: { width: 38, height: 38 },
  headerTexto: { flex: 1 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.dorado },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  content: { padding: 20, gap: 12 },
});
