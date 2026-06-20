import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarClientesApi } from '@/services/clientesApi';
import { buscarResPorCodigoApi } from '@/services/stockApi';
import { crearVentaApi, type ItemVentaInput } from '@/services/ventasApi';
import type { Cliente, Res } from '@/types';

const FRACCIONES = [
  { label: '1/4', factor: 0.25 },
  { label: '1/2', factor: 0.5 },
  { label: '3/4', factor: 0.75 },
  { label: 'Entera', factor: 1 },
];

interface Linea extends ItemVentaInput {
  garron: string | null;
  cor: string;
}

export default function NuevaVenta() {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [resEncontrada, setResEncontrada] = useState<Res | null>(null);
  const [buscandoRes, setBuscandoRes] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [kilos, setKilos] = useState('');
  const [precioKg, setPrecioKg] = useState('');

  const [lineas, setLineas] = useState<Linea[]>([]);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [numeroClienteBusqueda, setNumeroClienteBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarClientesApi().then(setClientes).catch(() => setClientes([]));
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = numeroClienteBusqueda.trim().toLowerCase();
    if (!q) return clientes.slice(0, 8);
    return clientes.filter(
      (c) => c.numeroCliente.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
    );
  }, [clientes, numeroClienteBusqueda]);

  const buscarRes = async () => {
    if (!codigoBusqueda.trim()) return;
    setBuscandoRes(true);
    try {
      const res = await buscarResPorCodigoApi(codigoBusqueda.trim());
      if (!res) {
        Alert.alert('Res no encontrada', 'No hay una res en stock con ese código.');
        return;
      }
      if (res.kilosDisponibles <= 0) {
        Alert.alert('Sin stock', 'Esa res ya no tiene kilos disponibles.');
        return;
      }
      setResEncontrada(res);
    } finally {
      setBuscandoRes(false);
    }
  };

  const aplicarFraccion = (factor: number) => {
    if (!resEncontrada) return;
    setKilos((resEncontrada.kilosDisponibles * factor).toFixed(1));
  };

  const agregarLinea = () => {
    const kilosNum = Number(kilos.replace(',', '.'));
    const precioNum = Number(precioKg.replace(',', '.'));
    if (!resEncontrada) {
      Alert.alert('Venta', 'Buscá primero la res a vender.');
      return;
    }
    if (!descripcion.trim() || !kilosNum || kilosNum <= 0 || !precioNum || precioNum <= 0) {
      Alert.alert('Venta', 'Completá descripción, kilos y precio por kilo.');
      return;
    }
    if (kilosNum > resEncontrada.kilosDisponibles) {
      Alert.alert('Venta', `Esa res solo tiene ${resEncontrada.kilosDisponibles} kg disponibles.`);
      return;
    }
    setLineas((prev) => [
      ...prev,
      {
        resId: resEncontrada.id,
        descripcion: descripcion.trim(),
        kilos: kilosNum,
        precioKg: precioNum,
        garron: resEncontrada.garron,
        cor: resEncontrada.cor,
      },
    ]);
    setResEncontrada(null);
    setCodigoBusqueda('');
    setDescripcion('');
    setKilos('');
    setPrecioKg('');
  };

  const total = lineas.reduce((acc, l) => acc + l.kilos * l.precioKg, 0);

  const confirmarVenta = async () => {
    if (!clienteSeleccionado) {
      Alert.alert('Venta', 'Seleccioná un cliente.');
      return;
    }
    if (lineas.length === 0) {
      Alert.alert('Venta', 'Agregá al menos una línea de venta.');
      return;
    }
    setGuardando(true);
    try {
      const venta = await crearVentaApi({
        clienteId: clienteSeleccionado.id,
        items: lineas.map(({ resId, descripcion: d, kilos: k, precioKg: p }) => ({
          resId,
          descripcion: d,
          kilos: k,
          precioKg: p,
        })),
      });
      router.replace(`/(admin)/ventas/${venta.id}/remito`);
    } catch (e) {
      Alert.alert('Venta', e instanceof Error ? e.message : 'No se pudo registrar la venta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen title="Nueva venta" subtitle="Registrar venta y generar remito" scrollable>
      <Text style={styles.seccion}>Cliente</Text>
      <Input
        label="Buscar por número o nombre"
        value={numeroClienteBusqueda}
        onChangeText={setNumeroClienteBusqueda}
      />
      {clienteSeleccionado ? (
        <View style={styles.cardSeleccion}>
          <Text style={styles.clienteNombre}>
            #{clienteSeleccionado.numeroCliente} · {clienteSeleccionado.nombre}
          </Text>
          <Button label="CAMBIAR" variant="secondary" onPress={() => setClienteSeleccionado(null)} />
        </View>
      ) : (
        clientesFiltrados.map((c) => (
          <View key={c.id} style={styles.cardCliente} onTouchEnd={() => setClienteSeleccionado(c)}>
            <Text style={styles.clienteNombre}>
              #{c.numeroCliente} · {c.nombre}
            </Text>
            {typeof c.saldo === 'number' ? (
              <Text style={styles.clienteSaldo}>Saldo: ${c.saldo.toFixed(2)}</Text>
            ) : null}
          </View>
        ))
      )}

      <Text style={styles.seccion}>Agregar res a la venta</Text>
      <View style={styles.card}>
        <Input
          label="Código (Cor) de la etiqueta"
          value={codigoBusqueda}
          onChangeText={setCodigoBusqueda}
          autoCapitalize="characters"
        />
        <Button label="BUSCAR RES" variant="secondary" loading={buscandoRes} onPress={() => void buscarRes()} />

        {resEncontrada ? (
          <View style={styles.resInfo}>
            <Text style={styles.clienteNombre}>
              Garrón {resEncontrada.garron ?? '–'} · {resEncontrada.kilosDisponibles} kg disponibles
            </Text>
            <Input label="Descripción (ej. cuarto trasero)" value={descripcion} onChangeText={setDescripcion} />
            <View style={styles.fraccionesRow}>
              {FRACCIONES.map((f) => (
                <View key={f.label} style={styles.chip} onTouchEnd={() => aplicarFraccion(f.factor)}>
                  <Text style={styles.chipTexto}>{f.label}</Text>
                </View>
              ))}
            </View>
            <Input label="Kilos" value={kilos} onChangeText={setKilos} keyboardType="decimal-pad" />
            <Input label="Precio por kilo" value={precioKg} onChangeText={setPrecioKg} keyboardType="decimal-pad" />
            <Button label="AGREGAR LÍNEA" onPress={agregarLinea} />
          </View>
        ) : null}
      </View>

      {lineas.length > 0 ? (
        <>
          <Text style={styles.seccion}>Líneas de la venta</Text>
          {lineas.map((l, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.clienteNombre}>
                Garrón {l.garron ?? '–'} · {l.descripcion}
              </Text>
              <Text style={styles.clienteSaldo}>
                {l.kilos} kg × ${l.precioKg} = ${(l.kilos * l.precioKg).toFixed(2)}
              </Text>
            </View>
          ))}
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </>
      ) : null}

      <Button label="CONFIRMAR VENTA Y GENERAR REMITO" loading={guardando} onPress={() => void confirmarVenta()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8 },
  cardCliente: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8 },
  cardSeleccion: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clienteNombre: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.grisTexto },
  clienteSaldo: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  resInfo: { gap: 4, marginTop: 8 },
  fraccionesRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.grisClaro,
    borderWidth: 1,
    borderColor: '#dcd2c8',
  },
  chipTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisTexto },
  total: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.doradoOscuro,
    textAlign: 'right',
    marginVertical: 8,
  },
});
