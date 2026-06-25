import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarClientesApi } from '@/services/clientesApi';
import { crearPedidoApi } from '@/services/pedidosApi';
import { listarProductosApi } from '@/services/productosApi';
import { buscarResPorCodigoApi } from '@/services/stockApi';
import { listarUsuariosApi } from '@/services/usuariosApi';
import type { Cliente, Producto, UsuarioAdmin } from '@/types';

interface Linea {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precio: number;
  garron?: string;
  tropa?: string;
  resId?: number;
  cor?: string;
}

export default function NuevoPedido() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [repartidores, setRepartidores] = useState<UsuarioAdmin[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<UsuarioAdmin | null>(null);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cor, setCor] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [garron, setGarron] = useState('');
  const [tropa, setTropa] = useState('');

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarClientesApi().then(setClientes).catch(() => setClientes([]));
    listarUsuariosApi()
      .then((us) => setRepartidores(us.filter((u) => u.rol === 'repartidor' && u.activo)))
      .catch(() => setRepartidores([]));
    listarProductosApi().then(setProductos).catch(() => setProductos([]));
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 15);
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q)).slice(0, 15);
  }, [clientes, busquedaCliente]);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return [];
    return productos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 8);
  }, [productos, busquedaProducto]);

  const elegirProducto = (p: Producto) => {
    setProductoSeleccionado(p);
    setBusquedaProducto('');
    setCor('');
    setCantidad('');
    setPrecio('');
    setGarron('');
    setTropa('');
  };

  const agregarLinea = async () => {
    if (!productoSeleccionado) return;
    const cantidadNum = Number(cantidad.replace(',', '.'));
    const precioNum = Number(precio.replace(',', '.'));
    if (!cantidadNum || cantidadNum <= 0 || !precioNum || precioNum < 0) {
      showAlert('Pedido', 'Completá cantidad y precio.');
      return;
    }

    let resId: number | undefined;
    if (productoSeleccionado.tieneCodigoBarra && cor.trim()) {
      const res = await buscarResPorCodigoApi(cor.trim());
      if (!res) {
        showAlert('Pedido', 'No se encontró una res con ese código.');
        return;
      }
      resId = res.id;
    }

    setLineas((prev) => [
      ...prev,
      {
        productoId: productoSeleccionado.id,
        productoNombre: productoSeleccionado.nombre,
        cantidad: cantidadNum,
        precio: precioNum,
        garron: garron.trim() || undefined,
        tropa: tropa.trim() || undefined,
        resId,
        cor: cor.trim() || undefined,
      },
    ]);
    setProductoSeleccionado(null);
    setCor('');
    setCantidad('');
    setPrecio('');
    setGarron('');
    setTropa('');
  };

  const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0);

  const guardarPedido = async () => {
    if (!clienteSeleccionado || !repartidorSeleccionado || lineas.length === 0) {
      showAlert('Pedido', 'Elegí cliente, repartidor y agregá al menos una línea.');
      return;
    }
    setGuardando(true);
    try {
      const { pedidoId } = await crearPedidoApi({
        clienteId: clienteSeleccionado.id,
        repartidor: repartidorSeleccionado.id,
        items: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precio: l.precio,
          garron: l.garron,
          tropa: l.tropa,
          resId: l.resId,
        })),
      });
      router.replace(`/(admin)/pedidos/${pedidoId}`);
    } catch (e) {
      showAlert('Pedido', e instanceof Error ? e.message : 'No se pudo crear el pedido.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen title="Nuevo pedido" subtitle="Cliente, repartidor y mercadería a entregar" scrollable>
      <View style={styles.card}>
        <Text style={styles.seccion}>Cliente</Text>
        {clienteSeleccionado ? (
          <View style={styles.filaSeleccion}>
            <Text style={styles.seleccionTexto}>{clienteSeleccionado.nombre}</Text>
            <Button label="CAMBIAR" variant="secondary" onPress={() => setClienteSeleccionado(null)} />
          </View>
        ) : (
          <>
            <Input label="Buscar cliente" value={busquedaCliente} onChangeText={setBusquedaCliente} />
            <FlatList
              data={clientesFiltrados}
              keyExtractor={(c) => String(c.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.opcionCard} onPress={() => setClienteSeleccionado(item)}>
                  <Text style={styles.opcionTexto}>{item.nombre}</Text>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Repartidor</Text>
        <View style={styles.fila}>
          {repartidores.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.chip, repartidorSeleccionado?.id === r.id && styles.chipActivo]}
              onPress={() => setRepartidorSeleccionado(r)}
            >
              <Text style={[styles.chipTexto, repartidorSeleccionado?.id === r.id && styles.chipTextoActivo]}>
                {r.nombre}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.seccion}>Agregar línea</Text>
        {productoSeleccionado ? (
          <>
            <Text style={styles.seleccionTexto}>{productoSeleccionado.nombre}</Text>
            {productoSeleccionado.tieneCodigoBarra ? (
              <Input label="Código (Cor) de la res" value={cor} onChangeText={setCor} />
            ) : null}
            <Input label={`Cantidad (${productoSeleccionado.unidad})`} value={cantidad} onChangeText={setCantidad} keyboardType="decimal-pad" />
            <Input label="Precio" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" />
            <Input label="Garrón (opcional)" value={garron} onChangeText={setGarron} />
            <Input label="Tropa (opcional)" value={tropa} onChangeText={setTropa} />
            <Button label="AGREGAR LÍNEA" onPress={() => void agregarLinea()} />
            <Button label="CANCELAR" variant="secondary" onPress={() => setProductoSeleccionado(null)} />
          </>
        ) : (
          <>
            <Input label="Buscar producto" value={busquedaProducto} onChangeText={setBusquedaProducto} />
            <FlatList
              data={productosFiltrados}
              keyExtractor={(p) => String(p.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable style={styles.opcionCard} onPress={() => elegirProducto(item)}>
                  <Text style={styles.opcionTexto}>{item.nombre}</Text>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      {lineas.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Líneas del pedido</Text>
          {lineas.map((l, i) => (
            <View key={i} style={styles.lineaCard}>
              <Text style={styles.opcionTexto}>
                {l.productoNombre} · {l.cantidad} × ${l.precio} = ${(l.cantidad * l.precio).toFixed(2)}
              </Text>
              {l.garron || l.tropa ? (
                <Text style={styles.sub}>
                  {l.garron ? `Garrón ${l.garron}` : ''} {l.tropa ? `· Tropa ${l.tropa}` : ''}
                </Text>
              ) : null}
            </View>
          ))}
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
          <Button label="GUARDAR PEDIDO" loading={guardando} onPress={() => void guardarPedido()} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, marginBottom: 12 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.grisTexto },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filaSeleccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seleccionTexto: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.doradoOscuro },
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
  opcionCard: { backgroundColor: COLORS.grisClaro, borderRadius: 12, padding: 10, marginTop: 6 },
  opcionTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  lineaCard: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.grisClaro },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
  total: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.doradoOscuro, textAlign: 'right', marginTop: 6 },
});
