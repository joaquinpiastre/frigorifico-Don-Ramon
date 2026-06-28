import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import LandingPage from '@/components/public/LandingPage';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const usuario = useAppStore((s) => s.usuario);

  // En web, la raíz del dominio siempre es la página pública del frigorífico,
  // tenga sesión guardada o no (el botón "Iniciar sesión"/"Ir a mi panel" de
  // la landing se encarga de mandar al personal a su panel). En la app nativa
  // (uso interno) se mantiene el ingreso directo al login o al panel.
  if (Platform.OS === 'web') return <LandingPage />;

  if (!usuario) return <Redirect href="/(auth)/login" />;
  if (usuario.rol === 'operador') return <Redirect href="/(operador)" />;
  if (usuario.rol === 'repartidor') return <Redirect href="/(repartidor)" />;
  return <Redirect href="/(admin)" />;
}
