import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { actualizarClienteApi, obtenerClienteApi, registrarPagoApi } from '@/services/clientesApi';
import type { Cliente, Pago, VentaResumen } from '@/types';

export default function ClienteDetalleRepartidor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [monto, setMonto] = useState('');
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    obtenerClienteApi(clienteId)
      .then((data) => {
        setCliente(data.cliente);
        setVentas(data.ventas);
        setPagos(data.pagos);
        setSaldo(data.saldo);
        setTelefono(data.cliente.telefono ?? '');
        setDireccion(data.cliente.direccion ?? '');
      })
      .catch(() => setCliente(null))
      .finally(() => setCargando(false));
  }, [clienteId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const guardarEdicion = async () => {
    setGuardandoEdicion(true);
    try {
      await actualizarClienteApi(clienteId, { telefono: telefono.trim(), direccion: direccion.trim() });
      setEditando(false);
      cargar();
    } catch (e) {
      showAlert('Cliente', e instanceof Error ? e.message : 'No se pudo actualizar el cliente.');
    } finally {
      setGuardandoEdicion(false);
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
      await registrarPagoApi({ clienteId, monto: montoNum });
      setMonto('');
      cargar();
    } catch (e) {
      showAlert('Pago', e instanceof Error ? e.message : 'No se pudo registrar el pago.');
    } finally {
      setRegistrandoPago(false);
    }
  };

  if (cargando) {
    return (
      <Screen title="Cliente" scrollable>
        <ActivityIndicator color={COLORS.negro} />
      </Screen>
    );
  }

  if (!cliente) {
    return (
      <Screen title="Cliente" scrollable>
        <Text>No se encontró el cliente.</Text>
      </Screen>
    );
  }

  return (
    <Screen title={cliente.nombre} subtitle={`Cliente #${cliente.numeroCliente}`} scrollable>
      <View style={styles.card}>
        <Text style={styles.seccion}>Datos del cliente</Text>
        {editando ? (
          <>
            <Input label="Teléfono" value={telefono} onChangeText={setTelefono} />
            <Input label="Dirección" value={direccion} onChangeText={setDireccion} />
            <Button label="GUARDAR" loading={guardandoEdicion} onPress={() => void guardarEdicion()} />
            <Button label="CANCELAR" variant="secondary" onPress={() => setEditando(false)} />
          </>
        ) : (
          <>
            <Text style={styles.dato}>
              <Text style={styles.datoLabel}>Teléfono: </Text>
              {cliente.telefono ?? '–'}
            </Text>
            <Text style={styles.dato}>
              <Text style={styles.datoLabel}>Dirección: </Text>
              {cliente.direccion ?? '–'}
            </Text>
            <Button label="EDITAR DATOS" variant="secondary" onPress={() => setEditando(true)} />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Saldo actual</Text>
        <Text style={[styles.saldo, saldo > 0 && styles.saldoDeudor]}>${saldo.toFixed(2)}</Text>
        <Input label="Registrar pago" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
        <Button label="REGISTRAR PAGO" loading={registrandoPago} onPress={() => void registrarPago()} />
      </View>

      <Text style={styles.seccion}>Historial de compras</Text>
      {ventas.length === 0 ? (
        <Text style={styles.vacio}>Todavía no tiene compras registradas.</Text>
      ) : (
        ventas.map((v) => (
          <View key={v.id} style={styles.card}>
            <Text style={styles.nombre}>Remito N° {v.numeroRemito}</Text>
            <Text style={styles.label}>{new Date(v.fecha).toLocaleDateString('es-AR')}</Text>
            <Text style={styles.importe}>${v.totalImporte.toFixed(2)}</Text>
          </View>
        ))
      )}

      <Text style={styles.seccion}>Pagos</Text>
      {pagos.length === 0 ? (
        <Text style={styles.vacio}>Todavía no registró pagos.</Text>
      ) : (
        pagos.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.nombre}>${p.monto.toFixed(2)}</Text>
            <Text style={styles.label}>{new Date(p.fecha).toLocaleDateString('es-AR')}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4, marginBottom: 8 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario, marginBottom: 8 },
  label: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  datoLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisSecundario },
  dato: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisTexto },
  nombre: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  importe: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.doradoOscuro },
  saldo: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.exito, marginBottom: 8 },
  saldoDeudor: { color: COLORS.error },
});
