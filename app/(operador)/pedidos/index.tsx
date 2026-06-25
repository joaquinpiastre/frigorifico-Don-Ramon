import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { armarPedidoApi, listarPedidosApi } from '@/services/pedidosApi';
import type { Pedido } from '@/types';

export default function PedidosParaArmar() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [armandoId, setArmandoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    listarPedidosApi({ estado: 'pendiente' })
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const marcarArmado = async (pedido: Pedido) => {
    setArmandoId(pedido.id);
    try {
      await armarPedidoApi(pedido.id);
      cargar();
    } catch (e) {
      showAlert('Pedido', e instanceof Error ? e.message : 'No se pudo marcar como armado.');
    } finally {
      setArmandoId(null);
    }
  };

  return (
    <Screen title="Pedidos para armar" subtitle="Separá la mercadería y marcá listo" scrollable>
      {!cargando && pedidos.length === 0 ? <Text style={styles.vacio}>No hay pedidos pendientes.</Text> : null}
      {pedidos.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cliente}>{p.clienteNombre}</Text>
          <Text style={styles.sub}>Repartidor: {p.repartidorNombre ?? p.repartidor}</Text>
          <Button label="MARCAR ARMADO" loading={armandoId === p.id} onPress={() => void marcarArmado(p)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, marginBottom: 10 },
  cliente: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  vacio: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario, textAlign: 'center', marginTop: 20 },
});
