import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { cargarPedidoApi, listarPedidosApi } from '@/services/pedidosApi';
import type { Pedido } from '@/types';

export default function PedidosParaCargar() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoId, setSubiendoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    listarPedidosApi({ estado: 'armado' })
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  useFocusEffect(cargar);

  const marcarCargado = async (pedido: Pedido) => {
    setSubiendoId(pedido.id);
    try {
      await cargarPedidoApi(pedido.id);
      cargar();
    } catch (e) {
      showAlert('Pedido', e instanceof Error ? e.message : 'No se pudo marcar como cargado.');
    } finally {
      setSubiendoId(null);
    }
  };

  return (
    <Screen title="Cargar a la camioneta" subtitle="Pedidos ya armados, listos para subir" scrollable>
      {!cargando && pedidos.length === 0 ? <Text style={styles.vacio}>No hay pedidos armados.</Text> : null}
      {pedidos.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cliente}>{p.clienteNombre}</Text>
          <Text style={styles.sub}>Repartidor: {p.repartidorNombre ?? p.repartidor}</Text>
          <Button label="MARCAR CARGADO" loading={subiendoId === p.id} onPress={() => void marcarCargado(p)} />
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
