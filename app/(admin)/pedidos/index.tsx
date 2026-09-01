import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarPedidosApi } from '@/services/pedidosApi';
import { formatoFechaCorta } from '@/utils/fecha';
import { ESTADO_PEDIDO_LABEL, type EstadoPedido, type Pedido } from '@/types';

const FILTROS: (EstadoPedido | 'todos')[] = ['todos', 'pendiente', 'armado', 'cargado', 'entregado'];

function aFechaCorta(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const RANGOS_RAPIDOS = ['todas', 'hoy', 'ayer', 'semana', 'mes'] as const;
type RangoRapido = (typeof RANGOS_RAPIDOS)[number];
const RANGO_RAPIDO_LABEL: Record<RangoRapido, string> = {
  todas: 'Todas las fechas',
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Últimos 7 días',
  mes: 'Este mes',
};

export default function PedidosIndex() {
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos');
  const [rangoRapido, setRangoRapido] = useState<RangoRapido>('todas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const elegirRango = (rango: RangoRapido) => {
    setRangoRapido(rango);
    const hoy = new Date();
    if (rango === 'todas') {
      setDesde('');
      setHasta('');
    } else if (rango === 'hoy') {
      setDesde(aFechaCorta(hoy));
      setHasta(aFechaCorta(hoy));
    } else if (rango === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      setDesde(aFechaCorta(ayer));
      setHasta(aFechaCorta(ayer));
    } else if (rango === 'semana') {
      const hace7 = new Date(hoy);
      hace7.setDate(hace7.getDate() - 6);
      setDesde(aFechaCorta(hace7));
      setHasta(aFechaCorta(hoy));
    } else if (rango === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setDesde(aFechaCorta(inicioMes));
      setHasta(aFechaCorta(hoy));
    }
  };

  const cargar = useCallback(() => {
    listarPedidosApi({
      estado: filtro === 'todos' ? undefined : filtro,
      desde: desde.trim() || undefined,
      hasta: hasta.trim() || undefined,
    })
      .then(setPedidos)
      .catch(() => setPedidos([]));
  }, [filtro, desde, hasta]);

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

      <Text style={styles.seccion}>Fecha</Text>
      <View style={styles.fila}>
        {RANGOS_RAPIDOS.map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, rangoRapido === r && styles.chipActivo]}
            onPress={() => elegirRango(r)}
          >
            <Text style={[styles.chipTexto, rangoRapido === r && styles.chipTextoActivo]}>
              {RANGO_RAPIDO_LABEL[r]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filaFechas}>
        <View style={{ flex: 1 }}>
          <Input
            label="Desde"
            value={desde}
            onChangeText={(v) => {
              setDesde(v);
              setRangoRapido('todas');
            }}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Hasta"
            value={hasta}
            onChangeText={(v) => {
              setHasta(v);
              setRangoRapido('todas');
            }}
            placeholder="AAAA-MM-DD"
            autoCapitalize="none"
          />
        </View>
      </View>

      {pedidos.length === 0 ? <Text style={styles.vacio}>No hay pedidos para este filtro.</Text> : null}
      {pedidos.map((p) => {
        const total = p.total ?? 0;
        const montoPagado = p.montoPagado ?? 0;
        return (
          <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/(admin)/pedidos/${p.id}`)}>
            <Text style={styles.cliente}>{p.clienteNombre}</Text>
            <Text style={styles.sub}>
              {formatoFechaCorta(p.fecha)} · {ESTADO_PEDIDO_LABEL[p.estado]} · Repartidor: {p.repartidorNombre ?? p.repartidor}
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
  filaFechas: { flexDirection: 'row', gap: 8 },
  seccion: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisSecundario, marginTop: 4 },
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
