import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarProductosApi } from '@/services/productosApi';
import { buscarResPorCodigoApi, crearResApi } from '@/services/stockApi';
import { registrarIngresoStockApi } from '@/services/stockItemsApi';
import type { Producto } from '@/types';

export default function RecepcionRapida() {
  // Recepción por código de barras (reses de vaca/cerdo)
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [altaPendiente, setAltaPendiente] = useState<string | null>(null);
  const [garron, setGarron] = useState('');
  const [kilos, setKilos] = useState('');
  const [guardandoRes, setGuardandoRes] = useState(false);
  const [mensajeCodigo, setMensajeCodigo] = useState<string | null>(null);
  const codigoRef = useRef<TextInput>(null);
  const kilosRef = useRef<TextInput>(null);

  // Recepción manual (embutidos, chorizos, morcillas, etc. sin código de barras)
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [mensajeStock, setMensajeStock] = useState<string | null>(null);
  const cantidadRef = useRef<TextInput>(null);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return [];
    return productos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [productos, busquedaProducto]);

  const cargarProductosSiHaceFalta = async () => {
    if (productos.length > 0) return;
    try {
      const data = await listarProductosApi();
      setProductos(data);
    } catch {
      // silencioso: el operador puede reintentar tipeando de nuevo
    }
  };

  const limpiarFlujoCodigo = () => {
    setCodigo('');
    setAltaPendiente(null);
    setGarron('');
    setKilos('');
    codigoRef.current?.focus();
  };

  const procesarCodigo = async () => {
    const cor = codigo.trim();
    if (!cor || buscando) return;
    setBuscando(true);
    setMensajeCodigo(null);
    try {
      const existente = await buscarResPorCodigoApi(cor);
      if (existente) {
        setMensajeCodigo(`Ya registrada · Garrón ${existente.garron ?? '–'} · ${existente.kilosDisponibles} kg`);
        limpiarFlujoCodigo();
        return;
      }
      setAltaPendiente(cor);
      setTimeout(() => kilosRef.current?.focus(), 50);
    } finally {
      setBuscando(false);
    }
  };

  const guardarRes = async () => {
    const kilosNum = Number(kilos.replace(',', '.'));
    if (!altaPendiente || !kilosNum || kilosNum <= 0 || guardandoRes) return;
    setGuardandoRes(true);
    try {
      const res = await crearResApi({ cor: altaPendiente, garron: garron.trim() || undefined, kilos: kilosNum });
      setMensajeCodigo(`✓ Garrón ${res.garron ?? '–'} · ${res.kilosIngreso} kg`);
      limpiarFlujoCodigo();
    } catch (e) {
      setMensajeCodigo(e instanceof Error ? e.message : 'No se pudo guardar la res.');
    } finally {
      setGuardandoRes(false);
    }
  };

  const elegirProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setBusquedaProducto('');
    setCantidad('');
    setTimeout(() => cantidadRef.current?.focus(), 50);
  };

  const guardarStock = async () => {
    const cantidadNum = Number(cantidad.replace(',', '.'));
    if (!productoSeleccionado || !cantidadNum || cantidadNum <= 0 || guardandoStock) return;
    setGuardandoStock(true);
    try {
      await registrarIngresoStockApi({ productoId: productoSeleccionado.id, cantidad: cantidadNum });
      setMensajeStock(`✓ ${productoSeleccionado.nombre} · ${cantidadNum} ${productoSeleccionado.unidad}`);
      setProductoSeleccionado(null);
      setCantidad('');
    } catch (e) {
      setMensajeStock(e instanceof Error ? e.message : 'No se pudo guardar el ingreso.');
    } finally {
      setGuardandoStock(false);
    }
  };

  return (
    <Screen title="Recepción rápida" subtitle="Escaneá o buscá el producto, anotá la cantidad y guardá" scrollable>
      <View style={styles.card}>
        <Text style={styles.seccion}>Reses (con código de barras)</Text>
        <Input
          ref={codigoRef}
          label="Código (Cor)"
          value={codigo}
          onChangeText={setCodigo}
          onSubmitEditing={() => void procesarCodigo()}
          editable={!altaPendiente}
          autoFocus
          blurOnSubmit={false}
          returnKeyType="done"
          placeholder="Esperando lectura…"
        />
        {mensajeCodigo ? <Text style={styles.mensaje}>{mensajeCodigo}</Text> : null}

        {altaPendiente ? (
          <View style={styles.altaBox}>
            <Text style={styles.altaTitulo}>Res nueva · {altaPendiente}</Text>
            <Input
              ref={kilosRef}
              label="Kilos"
              value={kilos}
              onChangeText={setKilos}
              keyboardType="decimal-pad"
              onSubmitEditing={() => void guardarRes()}
              returnKeyType="done"
              autoFocus
            />
            <Input label="Garrón (opcional)" value={garron} onChangeText={setGarron} />
            <Button label="GUARDAR" loading={guardandoRes} onPress={() => void guardarRes()} />
            <Button label="CANCELAR" variant="secondary" onPress={limpiarFlujoCodigo} />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Otros productos (sin código de barras)</Text>
        <Input
          label="Buscar producto"
          value={busquedaProducto}
          onChangeText={(t) => {
            setBusquedaProducto(t);
            void cargarProductosSiHaceFalta();
          }}
          placeholder="Ej: chorizo, morcilla…"
        />
        {productosFiltrados.length > 0 ? (
          <FlatList
            data={productosFiltrados}
            keyExtractor={(p) => String(p.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable style={styles.productoCard} onPress={() => elegirProducto(item)}>
                <Text style={styles.productoNombre}>{item.nombre}</Text>
                <Text style={styles.productoCategoria}>{item.categoria}</Text>
              </Pressable>
            )}
          />
        ) : null}
        {mensajeStock ? <Text style={styles.mensaje}>{mensajeStock}</Text> : null}

        {productoSeleccionado ? (
          <View style={styles.altaBox}>
            <Text style={styles.altaTitulo}>{productoSeleccionado.nombre}</Text>
            <Input
              ref={cantidadRef}
              label={`Cantidad (${productoSeleccionado.unidad})`}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="decimal-pad"
              onSubmitEditing={() => void guardarStock()}
              returnKeyType="done"
              autoFocus
            />
            <Button label="GUARDAR" loading={guardandoStock} onPress={() => void guardarStock()} />
            <Button label="CANCELAR" variant="secondary" onPress={() => setProductoSeleccionado(null)} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4, marginBottom: 12 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.grisTexto, marginBottom: 8 },
  mensaje: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.grisTexto,
    backgroundColor: COLORS.grisClaro,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  altaBox: { gap: 4, marginTop: 4 },
  altaTitulo: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.doradoOscuro, marginBottom: 4 },
  productoCard: {
    backgroundColor: COLORS.grisClaro,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productoNombre: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  productoCategoria: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.grisSecundario },
});
