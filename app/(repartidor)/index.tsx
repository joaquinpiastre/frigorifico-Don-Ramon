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
        label="PEDIDOS PARA ARMAR"
        variant="secondary"
        iconLeft={<Ionicons name="list-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/pedidos/armar')}
      />
      <Button
        label="PEDIDOS PARA CARGAR A LA CAMIONETA"
        variant="secondary"
        iconLeft={<Ionicons name="car-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/pedidos/cargar')}
      />
      <Button
        label="RECEPCIÓN RÁPIDA"
        variant="secondary"
        iconLeft={<Ionicons name="barcode-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/recepcion')}
      />
      <Button
        label="NUEVO PEDIDO"
        variant="secondary"
        iconLeft={<Ionicons name="add-circle-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/pedidos/nuevo')}
      />
      <Button
        label="CLIENTES"
        variant="secondary"
        iconLeft={<Ionicons name="people-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/clientes')}
      />
      <Button
        label="MAPA EN VIVO"
        variant="secondary"
        iconLeft={<Ionicons name="map-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(repartidor)/mapa')}
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
