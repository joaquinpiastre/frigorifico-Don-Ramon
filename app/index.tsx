import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import LandingPage from '@/components/public/LandingPage';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const usuario = useAppStore((s) => s.usuario);

  if (!usuario) {
    // En web, la raíz del dominio es la página pública del frigorífico.
    // En la app nativa (uso interno del personal) se va directo al login.
    if (Platform.OS === 'web') return <LandingPage />;
    return <Redirect href="/(auth)/login" />;
  }
  if (usuario.rol === 'operador') return <Redirect href="/(operador)" />;
  if (usuario.rol === 'repartidor') return <Redirect href="/(repartidor)" />;
  return <Redirect href="/(admin)" />;
}
