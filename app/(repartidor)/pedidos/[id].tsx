import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { registrarPagoApi } from '@/services/clientesApi';
import { entregarPedidoApi, obtenerPedidoApi } from '@/services/pedidosApi';
import { ESTADO_PEDIDO_LABEL, type PedidoDetalle } from '@/types';

export default function PedidoDetalleRepartidor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pedidoId = Number(id);

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [entregando, setEntregando] = useState(false);
  const [monto, setMonto] = useState('');
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const cargar = useCallback(() => {
    obtenerPedidoApi(pedidoId).then(setPedido).catch(() => setPedido(null));
  }, [pedidoId]);

  useFocusEffect(cargar);

  if (!pedido) {
    return (
      <Screen title="Pedido" scrollable>
        <Text style={styles.sub}>Cargando…</Text>
      </Screen>
    );
  }

  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);

  const marcarEntregado = async () => {
    setEntregando(true);
    try {
      await entregarPedidoApi(pedidoId);
      router.replace('/(repartidor)/pedidos');
    } catch (e) {
      showAlert('Pedido', e instanceof Error ? e.message : 'No se pudo marcar como entregado.');
    } finally {
      setEntregando(false);
    }
  };

  const registrarPago = async () => {
    const montoNum = Number(monto.replace(',', '.'));
    if (!montoNum || montoNum <= 0) {
      showAlert('Pago', 'Ingresá un monto válido.');
      return;
    }
    setRegistrandoPago(true);
    try {
      await registrarPagoApi({ clienteId: pedido.clienteId, monto: montoNum });
      setMonto('');
      showAlert('Pago', 'Pago registrado.');
    } catch (e) {
      showAlert('Pago', e instanceof Error ? e.message : 'No se pudo registrar el pago.');
    } finally {
      setRegistrandoPago(false);
    }
  };

  return (
    <Screen title={pedido.clienteNombre} subtitle={ESTADO_PEDIDO_LABEL[pedido.estado]} scrollable>
      <View style={styles.card}>
        {pedido.items.map((item) => (
          <View key={item.id} style={styles.lineaCard}>
            <Text style={styles.linea}>
              {item.productoNombre} · {item.cantidad} × ${item.precio} = ${(item.cantidad * item.precio).toFixed(2)}
            </Text>
            {item.garron ? <Text style={styles.sub}>Garrón {item.garron}</Text> : null}
          </View>
        ))}
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>

      {pedido.estado === 'cargado' ? (
        <Button label="MARCAR ENTREGADO" loading={entregando} onPress={() => void marcarEntregado()} />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.seccion}>Registrar pago</Text>
        <Input label="Monto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
        <Button label="IMPACTAR PAGO" loading={registrandoPago} onPress={() => void registrarPago()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, marginBottom: 12 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.grisTexto },
  lineaCard: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.grisClaro },
  linea: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoOscuro, textAlign: 'right', marginTop: 6 },
});
