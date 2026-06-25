import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { obtenerPedidoApi } from '@/services/pedidosApi';
import { ESTADO_PEDIDO_LABEL, type PedidoDetalle } from '@/types';

export default function PedidoDetalleAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);

  useFocusEffect(
    useCallback(() => {
      obtenerPedidoApi(Number(id)).then(setPedido).catch(() => setPedido(null));
    }, [id])
  );

  if (!pedido) {
    return (
      <Screen title="Pedido" subtitle="" scrollable>
        <Text style={styles.sub}>Cargando…</Text>
      </Screen>
    );
  }

  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);

  return (
    <Screen title={pedido.clienteNombre} subtitle={ESTADO_PEDIDO_LABEL[pedido.estado]} scrollable>
      <View style={styles.card}>
        <Text style={styles.sub}>Repartidor: {pedido.repartidorNombre ?? pedido.repartidor}</Text>
        {pedido.items.map((item) => (
          <View key={item.id} style={styles.lineaCard}>
            <Text style={styles.linea}>
              {item.productoNombre} · {item.cantidad} × ${item.precio} = ${(item.cantidad * item.precio).toFixed(2)}
            </Text>
            {item.garron || item.tropa || item.cor ? (
              <Text style={styles.sub}>
                {item.cor ? `Cor ${item.cor} · ` : ''}
                {item.garron ? `Garrón ${item.garron} · ` : ''}
                {item.tropa ? `Tropa ${item.tropa}` : ''}
              </Text>
            ) : null}
          </View>
        ))}
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6 },
  lineaCard: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.grisClaro },
  linea: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoOscuro, textAlign: 'right', marginTop: 6 },
});
