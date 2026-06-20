import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { restaurarSesionApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';

export default function RootLayout() {
  const ocultoSplash = useRef(false);
  const [sesionLista, setSesionLista] = useState(false);
  const setUsuario = useAppStore((s) => s.setUsuario);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const user = await restaurarSesionApi();
      if (!mounted) return;
      setUsuario(user);
      setSesionLista(true);
    })();
    return () => {
      mounted = false;
    };
  }, [setUsuario]);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const asegurarSplashOculto = () => {
    if (ocultoSplash.current) return;
    ocultoSplash.current = true;
    void SplashScreen.hideAsync().catch(() => {});
  };

  useEffect(() => {
    if (fontsLoaded || fontError) asegurarSplashOculto();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const t = setTimeout(() => asegurarSplashOculto(), 800);
    return () => clearTimeout(t);
  }, []);

  if (!sesionLista) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={Platform.OS === 'web' ? styles.rootWeb : styles.root}>
        <StatusBar style="light" />
        <Stack
          initialRouteName="index"
          screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootWeb: { flex: 1, height: '100%', minHeight: '100%', width: '100%' },
});
