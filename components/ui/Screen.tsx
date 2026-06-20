import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Container {...(containerProps as object)}>{children}</Container>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.grisClaro },
  header: {
    backgroundColor: COLORS.rojoOscuro,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#fff' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  content: { padding: 20, gap: 12 },
});
