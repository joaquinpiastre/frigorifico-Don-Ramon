import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { showAlert, showConfirm } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import { listarClientesApi } from "@/services/clientesApi";
import { crearPedidoApi } from "@/services/pedidosApi";
import { listarProductosApi } from "@/services/productosApi";
import { listarLotesApi, listarResesApi } from "@/services/stockApi";
import { listarRepartidoresApi } from "@/services/usuariosApi";
import type {
  CategoriaProducto,
  Cliente,
  LoteIngreso,
  Producto,
  Res,
  UsuarioAdmin,
} from "@/types";

interface Linea {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precio: number;
  garron?: string;
  tropa?: string;
  nota?: string;
  resId?: number;
  cor?: string;
  sinStock?: boolean;
  sinStockSuficiente?: boolean;
}

// Lo que realmente queda libre: lo que hay en stock menos lo que otros pedidos
// pendientes (aún sin armar) ya tienen anotado sobre esa misma res/producto.
function disponibleReal(cantidadTotal: number, reservado: number): number {
  return Math.max(0, cantidadTotal - reservado);
}

const SINONIMOS: Partial<Record<CategoriaProducto, string[]>> = {
  vacuno: ["vaca", "vacuno", "vacuna", "res", "ternera", "novillo", "carne"],
  cerdo: ["cerdo", "chancho", "cochino", "lechón", "lechon", "porcino"],
  toro: ["toro"],
};

function productoCoincide(producto: Producto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (producto.nombre.toLowerCase().includes(q)) return true;
  const sinonimos = SINONIMOS[producto.categoria] ?? [];
  return q
    .split(/\s+/)
    .some((token) => sinonimos.includes(token) || producto.categoria === token);
}

export default function NuevoPedidoOperador() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [repartidores, setRepartidores] = useState<UsuarioAdmin[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resesStock, setResesStock] = useState<Res[]>([]);
  const [lotes, setLotes] = useState<LoteIngreso[]>([]);

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [repartidorSeleccionado, setRepartidorSeleccionado] =
    useState<UsuarioAdmin | null>(null);

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [resSeleccionada, setResSeleccionada] = useState<Res | null>(null);
  const [cor, setCor] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [garron, setGarron] = useState("");
  const [tropa, setTropa] = useState("");
  const [nota, setNota] = useState("");

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarClientesApi()
      .then(setClientes)
      .catch(() => setClientes([]));
    listarRepartidoresApi()
      .then(setRepartidores)
      .catch(() => setRepartidores([]));
    listarProductosApi()
      .then(setProductos)
      .catch(() => setProductos([]));
    listarResesApi({ estado: "en_stock", limit: 500 })
      .then(setResesStock)
      .catch(() => setResesStock([]));
    listarLotesApi()
      .then(setLotes)
      .catch(() => setLotes([]));
  }, []);

  const lotesPorId = useMemo(
    () => new Map(lotes.map((l) => [l.id, l])),
    [lotes],
  );

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 15);
    return clientes
      .filter((c) => c.nombre.toLowerCase().includes(q))
      .slice(0, 15);
  }, [clientes, busquedaCliente]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto.trim()) return [];
    return productos
      .filter((p) => productoCoincide(p, busquedaProducto))
      .slice(0, 8);
  }, [productos, busquedaProducto]);

  const resesDelTipo = useMemo(() => {
    if (!productoSeleccionado?.tieneCodigoBarra) return [];
    return resesStock.filter(
      (r) => r.tipo === (productoSeleccionado.categoria as Res["tipo"]),
    );
  }, [resesStock, productoSeleccionado]);

  const elegirProducto = (p: Producto) => {
    setProductoSeleccionado(p);
    setBusquedaProducto("");
    setResSeleccionada(null);
    setCor("");
    setCantidad("");
    setPrecio("");
    setGarron("");
    setTropa("");
    setNota("");
  };

  const cancelarSeleccionProducto = () => {
    setProductoSeleccionado(null);
    setResSeleccionada(null);
    setCor("");
    setCantidad("");
    setPrecio("");
    setGarron("");
    setTropa("");
    setNota("");
  };

  const elegirRes = (res: Res) => {
    setResSeleccionada(res);
    setCor(res.cor);
    setGarron(res.garron ?? "");
    setTropa(lotesPorId.get(res.loteId)?.numeroTropa ?? "");
    setCantidad(String(disponibleReal(res.kilosDisponibles, res.reservado)));
  };

  const quitarResSeleccionada = () => {
    setResSeleccionada(null);
    setCor("");
    setGarron("");
    setTropa("");
    setCantidad("");
  };

  const resDisponibleReal = resSeleccionada
    ? disponibleReal(resSeleccionada.kilosDisponibles, resSeleccionada.reservado)
    : 0;
  const cantidadExcedeStock =
    resSeleccionada !== null &&
    Number(cantidad.replace(",", ".")) > resDisponibleReal;

  const productoDisponibleReal =
    productoSeleccionado && !productoSeleccionado.tieneCodigoBarra
      ? disponibleReal(
          productoSeleccionado.stockDisponible,
          productoSeleccionado.reservado,
        )
      : null;
  const cantidadExcedeStockProducto =
    productoDisponibleReal !== null &&
    Number(cantidad.replace(",", ".")) > productoDisponibleReal;

  const agregarLinea = async () => {
    if (!productoSeleccionado) return;
    const cantidadNum = Number(cantidad.replace(",", "."));
    const precioNum = Number(precio.replace(",", "."));
    if (!cantidadNum || cantidadNum <= 0 || !precioNum || precioNum < 0) {
      showAlert("Pedido", "Completá cantidad y precio.");
      return;
    }

    let sinStockSuficiente = false;
    const disponible = resSeleccionada
      ? resDisponibleReal
      : productoDisponibleReal;
    const reservadoDe = resSeleccionada
      ? resSeleccionada.reservado
      : productoSeleccionado.reservado;
    if (disponible !== null && cantidadNum > disponible) {
      const faltante = cantidadNum - disponible;
      const avisoReserva =
        reservadoDe > 0
          ? ` (${reservadoDe} ya está anotado en otro pedido pendiente)`
          : "";
      const confirmado = await showConfirm(
        "Sin stock suficiente",
        `${productoSeleccionado.nombre}: disponible ${disponible}, faltan ${faltante}${avisoReserva}. ¿Agregarlo igual al pedido?`,
      );
      if (!confirmado) return;
      sinStockSuficiente = true;
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
        nota: nota.trim() || undefined,
        resId: resSeleccionada?.id,
        cor: resSeleccionada?.cor ?? (cor.trim() || undefined),
        sinStock: productoSeleccionado.tieneCodigoBarra && !resSeleccionada,
        sinStockSuficiente,
      },
    ]);
    cancelarSeleccionProducto();
  };

  const total = lineas.reduce((acc, l) => acc + l.cantidad * l.precio, 0);

  const guardarPedido = async () => {
    if (!clienteSeleccionado || !repartidorSeleccionado || lineas.length === 0) {
      showAlert(
        "Pedido",
        "Elegí cliente, repartidor y agregá al menos una línea.",
      );
      return;
    }
    setGuardando(true);
    try {
      await crearPedidoApi({
        clienteId: clienteSeleccionado.id,
        repartidor: repartidorSeleccionado.id,
        items: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precio: l.precio,
          garron: l.garron,
          tropa: l.tropa,
          nota: l.nota,
          resId: l.resId,
        })),
      });
      router.replace("/(operador)/pedidos");
    } catch (e) {
      showAlert(
        "Pedido",
        e instanceof Error ? e.message : "No se pudo crear el pedido.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen
      title="Nuevo pedido"
      subtitle="Cliente, repartidor y mercadería"
      scrollable
    >
      <View style={styles.card}>
        <Text style={styles.seccion}>Cliente</Text>
        {clienteSeleccionado ? (
          <View style={styles.filaSeleccion}>
            <Text style={styles.seleccionTexto}>
              {clienteSeleccionado.nombre}
            </Text>
            <Button
              label="CAMBIAR"
              variant="secondary"
              onPress={() => setClienteSeleccionado(null)}
            />
          </View>
        ) : (
          <>
            <Input
              label="Buscar cliente"
              value={busquedaCliente}
              onChangeText={setBusquedaCliente}
            />
            <FlatList
              data={clientesFiltrados}
              keyExtractor={(c) => String(c.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.opcionCard}
                  onPress={() => setClienteSeleccionado(item)}
                >
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
              style={[
                styles.chip,
                repartidorSeleccionado?.id === r.id && styles.chipActivo,
              ]}
              onPress={() => setRepartidorSeleccionado(r)}
            >
              <Text
                style={[
                  styles.chipTexto,
                  repartidorSeleccionado?.id === r.id && styles.chipTextoActivo,
                ]}
              >
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
            <Text style={styles.seleccionTexto}>
              {productoSeleccionado.nombre}
            </Text>

            {productoSeleccionado.tieneCodigoBarra ? (
              <>
                <Text style={styles.subSeccion}>Elegí la unidad en stock</Text>
                {resesDelTipo.length === 0 ? (
                  <Text style={styles.aviso}>
                    ⚠️ No tenés stock de {productoSeleccionado.nombre} en este
                    momento.
                  </Text>
                ) : (
                  <FlatList
                    data={resesDelTipo}
                    keyExtractor={(r) => String(r.id)}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable
                        style={[
                          styles.opcionCard,
                          resSeleccionada?.id === item.id &&
                            styles.opcionCardActiva,
                        ]}
                        onPress={() => elegirRes(item)}
                      >
                        <Text style={styles.opcionTexto}>
                          Cor {item.cor}
                          {item.garron ? ` · Garrón ${item.garron}` : ""}
                        </Text>
                        <Text style={styles.sub}>
                          {disponibleReal(item.kilosDisponibles, item.reservado)} kg disponibles
                          {item.reservado > 0
                            ? ` (${item.reservado} kg ya reservados en otro pedido)`
                            : ""}
                          {item.clasificacion ? ` · ${item.clasificacion}` : ""}
                        </Text>
                      </Pressable>
                    )}
                  />
                )}

                {resSeleccionada ? (
                  <View style={styles.filaSeleccion}>
                    <Text style={styles.sub}>
                      Vinculado a Cor {resSeleccionada.cor}
                      {resSeleccionada.garron
                        ? ` · Garrón ${resSeleccionada.garron}`
                        : ""}
                    </Text>
                    <Button
                      label="QUITAR"
                      variant="secondary"
                      onPress={quitarResSeleccionada}
                    />
                  </View>
                ) : (
                  <Text style={styles.sub}>
                    {resesDelTipo.length > 0
                      ? "O agregalo sin vincularlo a una unidad puntual del stock:"
                      : "Podés agregarlo igual, sin vincularlo a stock:"}
                  </Text>
                )}
              </>
            ) : null}

            <Input
              label={`Cantidad a vender (${productoSeleccionado.unidad})`}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="decimal-pad"
              placeholder={resSeleccionada ? undefined : "Ej: 50"}
            />
            {resSeleccionada ? (
              <Text style={cantidadExcedeStock ? styles.aviso : styles.sub}>
                {cantidadExcedeStock
                  ? `⚠️ Disponible real: ${resDisponibleReal} kg${
                      resSeleccionada.reservado > 0
                        ? ` (${resSeleccionada.reservado} kg ya está anotado en otro pedido pendiente)`
                        : ""
                    }.`
                  : `Disponible: ${resDisponibleReal} kg.`}
              </Text>
            ) : null}
            {productoDisponibleReal !== null ? (
              <Text
                style={cantidadExcedeStockProducto ? styles.aviso : styles.sub}
              >
                {cantidadExcedeStockProducto
                  ? `⚠️ Disponible real: ${productoDisponibleReal} ${productoSeleccionado.unidad}${
                      productoSeleccionado.reservado > 0
                        ? ` (${productoSeleccionado.reservado} ya está anotado en otro pedido pendiente)`
                        : ""
                    }.`
                  : `Disponible: ${productoDisponibleReal} ${productoSeleccionado.unidad}.`}
              </Text>
            ) : null}
            <Input
              label="Precio"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
            />

            {!resSeleccionada ? (
              <>
                <Input
                  label="Garrón (opcional)"
                  value={garron}
                  onChangeText={setGarron}
                />
                <Input
                  label="Tropa (opcional)"
                  value={tropa}
                  onChangeText={setTropa}
                />
              </>
            ) : null}
            <Input
              label="Nota (opcional)"
              value={nota}
              onChangeText={setNota}
              placeholder="Ej: media res, sin hueso…"
            />

            {productoSeleccionado.tieneCodigoBarra && !resSeleccionada ? (
              <Text style={styles.aviso}>
                ⚠️ Esta línea no va a estar vinculada a stock existente.
              </Text>
            ) : null}

            <Button label="AGREGAR LÍNEA" onPress={() => void agregarLinea()} />
            <Button
              label="CANCELAR"
              variant="secondary"
              onPress={cancelarSeleccionProducto}
            />
          </>
        ) : (
          <>
            <Input
              label="Buscar producto"
              value={busquedaProducto}
              onChangeText={setBusquedaProducto}
              placeholder="Ej: carne de res, cerdo, chorizo…"
            />
            <FlatList
              data={productosFiltrados}
              keyExtractor={(p) => String(p.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.opcionCard}
                  onPress={() => elegirProducto(item)}
                >
                  <Text style={styles.opcionTexto}>{item.nombre}</Text>
                  {item.tieneCodigoBarra ? (
                    <Text style={styles.sub}>
                      {
                        resesStock.filter(
                          (r) => r.tipo === (item.categoria as Res["tipo"]),
                        ).length
                      }{" "}
                      unidad(es) en stock
                    </Text>
                  ) : (
                    <Text style={styles.sub}>
                      {disponibleReal(item.stockDisponible, item.reservado)}{" "}
                      {item.unidad} disponibles
                      {item.reservado > 0
                        ? ` (${item.reservado} ya reservados en otro pedido)`
                        : ""}
                    </Text>
                  )}
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
                {l.productoNombre} · {l.cantidad} × ${l.precio} = $
                {(l.cantidad * l.precio).toFixed(2)}
              </Text>
              {l.cor || l.garron || l.tropa ? (
                <Text style={styles.sub}>
                  {l.cor ? `Cor ${l.cor} · ` : ""}
                  {l.garron ? `Garrón ${l.garron} · ` : ""}
                  {l.tropa ? `Tropa ${l.tropa}` : ""}
                </Text>
              ) : null}
              {l.nota ? <Text style={styles.sub}>📝 {l.nota}</Text> : null}
              {l.sinStock ? (
                <Text style={styles.aviso}>⚠️ Sin stock vinculado</Text>
              ) : null}
              {l.sinStockSuficiente ? (
                <Text style={styles.aviso}>
                  ⚠️ Agregada sin stock suficiente
                </Text>
              ) : null}
            </View>
          ))}
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
          <Button
            label="GUARDAR PEDIDO"
            loading={guardando}
            onPress={() => void guardarPedido()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.grisTexto,
  },
  subSeccion: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisSecundario,
    marginTop: 4,
  },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filaSeleccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seleccionTexto: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.doradoOscuro,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dcd2c8",
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisTexto,
  },
  chipTextoActivo: { color: "#fff" },
  opcionCard: {
    backgroundColor: COLORS.grisClaro,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    gap: 2,
  },
  opcionCardActiva: { backgroundColor: COLORS.doradoClaro },
  opcionTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  lineaCard: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClaro,
    gap: 2,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  aviso: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.advertencia,
  },
  total: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.doradoOscuro,
    textAlign: "right",
    marginTop: 6,
  },
});
