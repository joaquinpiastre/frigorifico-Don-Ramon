import { Redirect, Stack } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function AdminLayout() {
  const usuario = useAppStore((s) => s.usuario);

  if (!usuario) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
