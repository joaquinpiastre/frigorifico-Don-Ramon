import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

export default function RepartidorHome() {
  const { usuario, resetSesion } = useAppStore();

  return (
    <Screen title={`Hola, ${usuario?.nombre ?? ''}`} subtitle="Tu reparto de hoy" scrollable>
      <Button
        label="MIS PEDIDOS"
        iconLeft={<Ionicons name="cart-outline" size={18} color={COLORS.blanco} />}
        onPress={() => router.push('/(repartidor)/pedidos')}
      />
      <Button
        label="CLIENTES"
        variant="secondary"
        iconLeft={<Ionicons name="people-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/clientes')}
      />
      <Button
        label="CERRAR SESIÓN"
        variant="danger"
        iconLeft={<Ionicons name="log-out-outline" size={18} color={COLORS.blanco} />}
        onPress={() => {
          resetSesion();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}
