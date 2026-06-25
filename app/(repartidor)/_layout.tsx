import { Redirect, Stack } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function RepartidorLayout() {
  const usuario = useAppStore((s) => s.usuario);

  if (!usuario) return <Redirect href="/(auth)/login" />;
  if (usuario.rol !== 'repartidor' && usuario.rol !== 'admin') return <Redirect href="/(operador)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
