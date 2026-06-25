import { Redirect, Stack } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function OperadorLayout() {
  const usuario = useAppStore((s) => s.usuario);

  if (!usuario) return <Redirect href="/(auth)/login" />;
  if (usuario.rol !== 'operador' && usuario.rol !== 'admin') return <Redirect href="/(repartidor)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
