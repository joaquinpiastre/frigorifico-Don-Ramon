import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const usuario = useAppStore((s) => s.usuario);

  if (!usuario) return <Redirect href="/(auth)/login" />;
  if (usuario.rol === 'operador') return <Redirect href="/(operador)" />;
  if (usuario.rol === 'repartidor') return <Redirect href="/(repartidor)" />;
  return <Redirect href="/(admin)" />;
}
