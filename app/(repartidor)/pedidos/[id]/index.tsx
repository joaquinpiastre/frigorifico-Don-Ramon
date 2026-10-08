import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { showAlert, showConfirm } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MetodoPagoSelector } from '@/components/ui/MetodoPagoSelector';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { registrarPagoApi } from '@/services/clientesApi';
import {
  eliminarPedidoApi,
  entregarPedidoApi,
  obtenerPedidoApi,
  repesarItemApi,
} from '@/services/pedidosApi';
import { ESTADO_PEDIDO_LABEL, METODO_PAGO_LABEL, type MetodoPago, type PedidoDetalle } from '@/types';

export default function PedidoDetalleRepartidor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pedidoId = Number(id);

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [entregando, setEntregando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [diasCheque, setDiasCheque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [banco, setBanco] = useState('');
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [repesajes, setRepesajes] = useState<Record<number, string>>({});
  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [guardandoRepesajeId, setGuardandoRepesajeId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    obtenerPedidoApi(pedidoId)
      .then((p) => {
        setPedido(p);
        setRepesajes((prev) => {
          const next = { ...prev };
          for (const item of p.items) {
            if (item.resId && next[item.id] === undefined) next[item.id] = String(item.cantidad);
          }
          return next;
        });
        setPrecios((prev) => {
          const next = { ...prev };
          for (const item of p.items) {
            if (item.resId && next[item.id] === undefined) next[item.id] = String(item.precio);
          }
          return next;
        });
      })
      .catch(() => setPedido(null));
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
  const montoPagado = pedido.pagos.reduce((acc, p) => acc + p.monto, 0);
  const pendiente = Math.max(0, total - montoPagado);

  // Si quedó un peso/precio escrito sin guardar, se aplica antes de cobrar o entregar.
  const aplicarRepesajesPendientes = async () => {
    for (const item of pedido.items) {
      if (!item.resId) continue;
      const peso = Number((repesajes[item.id] ?? '').replace(',', '.'));
      const precio = Number((precios[item.id] ?? '').replace(',', '.'));
      if (!peso || peso <= 0) throw new Error('Ingresá un peso válido.');
      if (Number.isNaN(precio) || precio < 0) throw new Error('Ingresá un precio válido.');
      if (peso !== item.cantidad || precio !== item.precio) {
        await repesarItemApi(pedido.id, item.id, { cantidad: peso, precio });
      }
    }
  };

  const marcarEntregado = async () => {
    setEntregando(true);
    try {
      await aplicarRepesajesPendientes();
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
    if (!metodoPago) {
      showAlert('Pago', 'Elegí la forma de pago.');
      return;
    }
    const diasChequeNum = Number(diasCheque);
    if (metodoPago === 'cheque' && (!diasChequeNum || diasChequeNum <= 0)) {
      showAlert('Pago', 'Indicá a cuántos días es el cheque.');
      return;
    }
    if (metodoPago === 'cheque' && !numeroCheque.trim()) {
      showAlert('Pago', 'Indicá el número de cheque.');
      return;
    }
    if (metodoPago === 'cheque' && !banco.trim()) {
      showAlert('Pago', 'Indicá el banco del cheque.');
      return;
    }
    setRegistrandoPago(true);
    try {
      await aplicarRepesajesPendientes();
      await registrarPagoApi({
        clienteId: pedido.clienteId,
        pedidoId: pedido.id,
        monto: montoNum,
        metodo: metodoPago,
        diasCheque: metodoPago === 'cheque' ? diasChequeNum : undefined,
        numeroCheque: metodoPago === 'cheque' ? numeroCheque.trim() : undefined,
        banco: metodoPago === 'cheque' ? banco.trim() : undefined,
      });
      setMonto('');
      setMetodoPago(null);
      setDiasCheque('');
      setNumeroCheque('');
      setBanco('');
      // Al cobrar un pedido que ya está en la camioneta, se da por entregado y se sale.
      if (pedido.estado === 'cargado') {
        try {
          await entregarPedidoApi(pedido.id);
        } catch (e) {
          showAlert(
            'Pago',
            `El pago se registró, pero no se pudo marcar como entregado: ${
              e instanceof Error ? e.message : 'error desconocido'
            }`,
          );
          cargar();
          return;
        }
        showAlert('Pago', 'Pago registrado. El pedido quedó como entregado.');
        router.replace('/(repartidor)/pedidos');
        return;
      }
      showAlert('Pago', 'Pago registrado.');
      cargar();
    } catch (e) {
      showAlert('Pago', e instanceof Error ? e.message : 'No se pudo registrar el pago.');
    } finally {
      setRegistrandoPago(false);
    }
  };

  const guardarRepesaje = async (itemId: number) => {
    const pesoReal = Number((repesajes[itemId] ?? '').replace(',', '.'));
    const precioReal = Number((precios[itemId] ?? '').replace(',', '.'));
    if (!pesoReal || pesoReal <= 0) {
      showAlert('Repesaje', 'Ingresá un peso válido.');
      return;
    }
    if (!precioReal || precioReal < 0) {
      showAlert('Repesaje', 'Ingresá un precio válido.');
      return;
    }
    setGuardandoRepesajeId(itemId);
    try {
      await repesarItemApi(pedido.id, itemId, { cantidad: pesoReal, precio: precioReal });
      cargar();
    } catch (e) {
      showAlert('Repesaje', e instanceof Error ? e.message : 'No se pudo guardar el repesaje.');
    } finally {
      setGuardandoRepesajeId(null);
    }
  };

  const eliminarPedido = async () => {
    const confirmado = await showConfirm(
      'Eliminar pedido',
      `¿Eliminar el pedido de ${pedido.clienteNombre}? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setEliminando(true);
    try {
      await eliminarPedidoApi(pedido.id);
      router.replace('/(repartidor)/pedidos');
    } catch (e) {
      showAlert('Pedido', e instanceof Error ? e.message : 'No se pudo eliminar el pedido.');
    } finally {
      setEliminando(false);
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
            {item.resId ? (
              <View style={styles.repesajeRow}>
                <Text style={styles.repesajeLabel}>Peso (kg):</Text>
                <TextInput
                  style={styles.repesajeInput}
                  value={repesajes[item.id] ?? String(item.cantidad)}
                  onChangeText={(v) => setRepesajes((prev) => ({ ...prev, [item.id]: v }))}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.repesajeLabel}>Precio:</Text>
                <TextInput
                  style={styles.repesajeInput}
                  value={precios[item.id] ?? String(item.precio)}
                  onChangeText={(v) => setPrecios((prev) => ({ ...prev, [item.id]: v }))}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Button
                  label="GUARDAR"
                  variant="secondary"
                  loading={guardandoRepesajeId === item.id}
                  onPress={() => void guardarRepesaje(item.id)}
                />
              </View>
            ) : null}
          </View>
        ))}
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>

      <Button
        label="VER / COMPARTIR REMITO"
        variant="secondary"
        onPress={() => router.push(`/(repartidor)/pedidos/${pedido.id}/remito`)}
      />

      {pedido.estado === 'cargado' ? (
        <Button label="MARCAR ENTREGADO" loading={entregando} onPress={() => void marcarEntregado()} />
      ) : null}

      <View style={styles.filaAcciones}>
        <Button
          label="EDITAR"
          variant="secondary"
          onPress={() => router.push(`/(repartidor)/pedidos/${pedido.id}/editar`)}
        />
        <Button label="ELIMINAR" variant="danger" loading={eliminando} onPress={() => void eliminarPedido()} />
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Registrar pago</Text>
        {pedido.pagos.map((pago) => (
          <Text key={pago.id} style={styles.sub}>
            ${pago.monto.toFixed(2)} · {pago.metodo ? METODO_PAGO_LABEL[pago.metodo] : 'Sin método'} ·{' '}
            {new Date(pago.fecha).toLocaleString('es-AR')}
          </Text>
        ))}
        <Text style={styles.sub}>
          Pagado ${montoPagado.toFixed(2)} · Pendiente ${pendiente.toFixed(2)}
        </Text>
        {pedido.estado === 'cargado' ? (
          <Text style={styles.sub}>Al impactar el pago, el pedido queda como entregado.</Text>
        ) : null}
        <Input label="Monto ($)" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
        <MetodoPagoSelector
          metodo={metodoPago}
          onMetodoChange={setMetodoPago}
          diasCheque={diasCheque}
          onDiasChequeChange={setDiasCheque}
          numeroCheque={numeroCheque}
          onNumeroChequeChange={setNumeroCheque}
          banco={banco}
          onBancoChange={setBanco}
        />
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
  filaAcciones: { flexDirection: 'row', gap: 8 },
  repesajeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  repesajeLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisTexto },
  repesajeInput: {
    borderWidth: 1,
    borderColor: COLORS.doradoOscuro,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.grisTexto,
    minWidth: 72,
    textAlign: 'center',
  },
});
