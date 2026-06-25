import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarPedidosApi } from '@/services/pedidosApi';
import { useAppStore } from '@/store/useAppStore';
import type { Pedido } from '@/types';

export default function MisPedidos() {
  const usuario = useAppStore((s) => s.usuario);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!usuario) return;
      listarPedidosApi({ estado: 'cargado', repartidor: usuario.id })
        .then(setPedidos)
        .catch(() => setPedidos([]));
    }, [usuario])
  );

  return (
    <Screen title="Mis pedidos" subtitle="Cargados en la camioneta" scrollable>
      {pedidos.length === 0 ? <Text style={styles.vacio}>No tenés pedidos cargados todavía.</Text> : null}
      {pedidos.map((p) => (
        <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/(repartidor)/pedidos/${p.id}`)}>
          <Text style={styles.cliente}>{p.clienteNombre}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  cliente: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  vacio: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario, textAlign: 'center', marginTop: 20 },
});
