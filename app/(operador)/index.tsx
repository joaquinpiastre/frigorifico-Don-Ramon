import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

export default function OperadorHome() {
  const { usuario, resetSesion } = useAppStore();

  return (
    <Screen title={`Hola, ${usuario?.nombre ?? ''}`} subtitle="Recepción de mercadería" scrollable>
      <Button
        label="RECEPCIÓN RÁPIDA"
        iconLeft={<Ionicons name="barcode-outline" size={18} color={COLORS.blanco} />}
        onPress={() => router.push('/(operador)/recepcion')}
      />
      <Button
        label="PEDIDOS PARA ARMAR"
        variant="secondary"
        iconLeft={<Ionicons name="list-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(operador)/pedidos')}
      />
      <Button
        label="PEDIDOS PARA CARGAR A LA CAMIONETA"
        variant="secondary"
        iconLeft={<Ionicons name="car-outline" size={18} color={COLORS.negro} />}
        onPress={() => router.push('/(operador)/pedidos/cargar')}
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
