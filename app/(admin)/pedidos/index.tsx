import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarPedidosApi } from '@/services/pedidosApi';
import { ESTADO_PEDIDO_LABEL, type EstadoPedido, type Pedido } from '@/types';

const FILTROS: (EstadoPedido | 'todos')[] = ['todos', 'pendiente', 'armado', 'cargado', 'entregado'];

export default function PedidosIndex() {
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const cargar = useCallback(() => {
    listarPedidosApi(filtro === 'todos' ? undefined : { estado: filtro })
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, [filtro]);

  useFocusEffect(cargar);

  return (
    <Screen title="Pedidos" subtitle="Seguimiento de pedidos a clientes" scrollable>
      <Button
        label="NUEVO PEDIDO"
        iconLeft={<Ionicons name="add-circle-outline" size={18} color={COLORS.blanco} />}
        onPress={() => router.push('/(admin)/pedidos/nuevo')}
      />
      <View style={styles.fila}>
        {FILTROS.map((f) => (
          <Pressable key={f} style={[styles.chip, filtro === f && styles.chipActivo]} onPress={() => setFiltro(f)}>
            <Text style={[styles.chipTexto, filtro === f && styles.chipTextoActivo]}>
              {f === 'todos' ? 'Todos' : ESTADO_PEDIDO_LABEL[f]}
            </Text>
          </Pressable>
        ))}
      </View>

      {pedidos.length === 0 ? <Text style={styles.vacio}>No hay pedidos para este filtro.</Text> : null}
      {pedidos.map((p) => {
        const total = p.total ?? 0;
        const montoPagado = p.montoPagado ?? 0;
        return (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/(admin)/pedidos/${p.id}`)}>
            <Text style={styles.cliente}>{p.clienteNombre}</Text>
            <Text style={styles.sub}>
              {ESTADO_PEDIDO_LABEL[p.estado]} · Repartidor: {p.repartidorNombre ?? p.repartidor}
            </Text>
            {p.estado === "entregado" ? (
              <Text
                style={[
                  styles.estadoPago,
                  montoPagado >= total
                    ? styles.estadoPagoOk
                    : montoPagado > 0
                      ? styles.estadoPagoParcial
                      : styles.estadoPagoDeuda,
                ]}
              >
                {montoPagado >= total
                  ? "PAGADO"
                  : montoPagado > 0
                    ? `PARCIAL: $${montoPagado.toFixed(0)} de $${total.toFixed(0)}`
                    : "SIN PAGAR"}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcd2c8',
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisTexto },
  chipTextoActivo: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4, marginBottom: 8 },
  cliente: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  estadoPago: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  estadoPagoOk: { backgroundColor: '#dff5e1', color: '#1f7a3d' },
  estadoPagoParcial: { backgroundColor: '#fff2d6', color: '#9a6a00' },
  estadoPagoDeuda: { backgroundColor: '#fde1e1', color: '#a3231f' },
  vacio: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario, textAlign: 'center', marginTop: 20 },
});
