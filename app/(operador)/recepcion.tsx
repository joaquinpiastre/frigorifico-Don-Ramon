import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import { listarProductosApi } from "@/services/productosApi";
import {
  buscarResPorCodigoApi,
  crearLoteApi,
  crearResApi,
  listarLotesApi,
} from "@/services/stockApi";
import { registrarIngresoStockApi } from "@/services/stockItemsApi";
import {
  TIPO_RES_LABEL,
  type LoteIngreso,
  type Producto,
  type TipoRes,
} from "@/types";

const TIPOS: TipoRes[] = ["vacuno", "toro", "cerdo", "otro"];

export default function RecepcionRapida() {
  // Tropa: identifica el lote de ingreso bajo el cual se recibe todo lo demás.
  const [numeroTropa, setNumeroTropa] = useState("");
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteIngreso | null>(
    null,
  );
  const [buscandoTropa, setBuscandoTropa] = useState(false);
  const [mensajeTropa, setMensajeTropa] = useState<string | null>(null);
  const tropaRef = useRef<TextInput>(null);

  // Recepción por código de barras (reses de vaca/cerdo)
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [altaPendiente, setAltaPendiente] = useState<string | null>(null);
  const [garron, setGarron] = useState("");
  const [tipo, setTipo] = useState<TipoRes>("vacuno");
  const [kilos, setKilos] = useState("");
  const [guardandoRes, setGuardandoRes] = useState(false);
  const [mensajeCodigo, setMensajeCodigo] = useState<string | null>(null);
  const codigoRef = useRef<TextInput>(null);
  const kilosRef = useRef<TextInput>(null);

  // Recepción manual (embutidos, chorizos, morcillas, etc. sin código de barras)
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState("");
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [mensajeStock, setMensajeStock] = useState<string | null>(null);
  const cantidadRef = useRef<TextInput>(null);

  // Refs que siempre tienen el valor actual — el listener global los lee sin closure viejo
  const altaPendienteRef = useRef(altaPendiente);
  const loteSeleccionadoRef = useRef(loteSeleccionado);
  const buscandoRef = useRef(buscando);
  useEffect(() => { altaPendienteRef.current = altaPendiente; }, [altaPendiente]);
  useEffect(() => { loteSeleccionadoRef.current = loteSeleccionado; }, [loteSeleccionado]);
  useEffect(() => { buscandoRef.current = buscando; }, [buscando]);

  // Limpia lo que manda el lector Code 39: quita * de inicio/fin y sufijos como - o espacio
  const limpiarCodigoScanner = (raw: string): string =>
    raw.replace(/^\*+/, "").replace(/\*[-\s]*$/, "").replace(/[-\s]+$/, "").trim();

  const procesarCodigoDirecto = async (rawCor: string) => {
    const cor = limpiarCodigoScanner(rawCor);
    if (!cor || buscandoRef.current) return;
    setBuscando(true);
    buscandoRef.current = true;
    setMensajeCodigo(null);
    try {
      const existente = await buscarResPorCodigoApi(cor);
      if (existente) {
        setMensajeCodigo(
          `Ya registrada · Garrón ${existente.garron ?? "–"} · ${existente.kilosDisponibles} kg`,
        );
        limpiarFlujoCodigo();
        return;
      }
      setAltaPendiente(cor);
      setTimeout(() => kilosRef.current?.focus(), 50);
    } finally {
      setBuscando(false);
      buscandoRef.current = false;
    }
  };

  // En web los lectores USB actúan como teclado: tipean muy rápido y mandan Enter.
  // Usamos un ref para el callback así el listener nunca usa un closure viejo.
  const procesarCodigoRef = useRef(procesarCodigoDirecto);
  useEffect(() => { procesarCodigoRef.current = procesarCodigoDirecto; });

  const scanBufferRef = useRef("");
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Si el foco está en un input que NO es el campo de código, ignoramos
      const isOtherInput =
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        target !== (codigoRef.current as unknown as HTMLElement);
      if (isOtherInput) return;

      // Enter o Tab = terminador del lector
      if (e.key === "Enter" || e.key === "Tab") {
        const scanned = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        if (scanTimerRef.current) {
          clearTimeout(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        if (scanned && !altaPendienteRef.current && loteSeleccionadoRef.current) {
          e.preventDefault();
          setMensajeCodigo(null);
          setCodigo(scanned);
          void procesarCodigoRef.current(scanned);
        }
        return;
      }

      // Acumular caracteres imprimibles
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanBufferRef.current += e.key;
        // 200ms sin nueva tecla → no era un scanner (tipeo humano), limpiar buffer
        scanTimerRef.current = setTimeout(() => {
          scanBufferRef.current = "";
        }, 200);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return [];
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(q))
      .slice(0, 8);
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

  const confirmarTropa = async () => {
    const numero = numeroTropa.trim();
    if (!numero || buscandoTropa) return;
    setBuscandoTropa(true);
    setMensajeTropa(null);
    try {
      const lotes = await listarLotesApi();
      const existente = lotes.find(
        (l) => l.numeroTropa.toLowerCase() === numero.toLowerCase(),
      );
      const lote = existente ?? (await crearLoteApi({ numeroTropa: numero }));
      setLoteSeleccionado(lote);
    } catch (e) {
      setMensajeTropa(
        e instanceof Error ? e.message : "No se pudo identificar la tropa.",
      );
    } finally {
      setBuscandoTropa(false);
    }
  };

  const cambiarTropa = () => {
    setLoteSeleccionado(null);
    setNumeroTropa("");
    setMensajeTropa(null);
    setTimeout(() => tropaRef.current?.focus(), 50);
  };

  const limpiarFlujoCodigo = () => {
    setCodigo("");
    setAltaPendiente(null);
    setGarron("");
    setTipo("vacuno");
    setKilos("");
    codigoRef.current?.focus();
  };

  const procesarCodigo = async () => {
    await procesarCodigoDirecto(codigo);
  };

  const guardarRes = async () => {
    const kilosNum = Number(kilos.replace(",", "."));
    if (!altaPendiente || !kilosNum || kilosNum <= 0 || guardandoRes) return;
    setGuardandoRes(true);
    try {
      const res = await crearResApi({
        loteId: loteSeleccionado?.id,
        cor: altaPendiente,
        garron: garron.trim() || undefined,
        tipo,
        kilos: kilosNum,
      });
      setMensajeCodigo(
        `✓ Garrón ${res.garron ?? "–"} · ${res.kilosIngreso} kg`,
      );
      limpiarFlujoCodigo();
    } catch (e) {
      setMensajeCodigo(
        e instanceof Error ? e.message : "No se pudo guardar la res.",
      );
    } finally {
      setGuardandoRes(false);
    }
  };

  const elegirProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setBusquedaProducto("");
    setCantidad("");
    setTimeout(() => cantidadRef.current?.focus(), 50);
  };

  const guardarStock = async () => {
    const cantidadNum = Number(cantidad.replace(",", "."));
    if (
      !productoSeleccionado ||
      !cantidadNum ||
      cantidadNum <= 0 ||
      guardandoStock
    )
      return;
    setGuardandoStock(true);
    try {
      await registrarIngresoStockApi({
        productoId: productoSeleccionado.id,
        loteId: loteSeleccionado?.id,
        cantidad: cantidadNum,
      });
      setMensajeStock(
        `✓ ${productoSeleccionado.nombre} · ${cantidadNum} ${productoSeleccionado.unidad}`,
      );
      setProductoSeleccionado(null);
      setCantidad("");
    } catch (e) {
      setMensajeStock(
        e instanceof Error ? e.message : "No se pudo guardar el ingreso.",
      );
    } finally {
      setGuardandoStock(false);
    }
  };

  return (
    <Screen
      title="Recepción rápida"
      subtitle="Escaneá o buscá el producto, anotá la cantidad y guardá"
      scrollable
    >
      <View style={styles.card}>
        <Text style={styles.seccion}>Tropa</Text>
        {loteSeleccionado ? (
          <View style={styles.tropaActiva}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tropaNumero}>
                Tropa {loteSeleccionado.numeroTropa}
              </Text>
              <Text style={styles.tropaSub}>
                Lo que recibas a continuación queda asociado a esta tropa.
              </Text>
            </View>
            <Button
              label="CAMBIAR"
              variant="secondary"
              onPress={cambiarTropa}
            />
          </View>
        ) : (
          <>
            <Input
              ref={tropaRef}
              label="Número de tropa"
              value={numeroTropa}
              onChangeText={setNumeroTropa}
              onSubmitEditing={() => void confirmarTropa()}
              autoFocus
              returnKeyType="done"
              placeholder="Ej: 1234"
            />
            {mensajeTropa ? (
              <Text style={styles.mensaje}>{mensajeTropa}</Text>
            ) : null}
            <Button
              label="CONFIRMAR TROPA"
              loading={buscandoTropa}
              onPress={() => void confirmarTropa()}
            />
          </>
        )}
      </View>

      {!loteSeleccionado ? (
        <Text style={styles.vacio}>
          Identificá la tropa para empezar a recibir mercadería.
        </Text>
      ) : (
        <>
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
            {mensajeCodigo ? (
              <Text style={styles.mensaje}>{mensajeCodigo}</Text>
            ) : null}

            {altaPendiente ? (
              <View style={styles.altaBox}>
                <Text style={styles.altaTitulo}>
                  Res nueva · {altaPendiente}
                </Text>
                <Text style={styles.tipoLabel}>Tipo de producto</Text>
                <View style={styles.filaChips}>
                  {TIPOS.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.chip, tipo === t && styles.chipActivo]}
                      onPress={() => setTipo(t)}
                    >
                      <Text
                        style={[
                          styles.chipTexto,
                          tipo === t && styles.chipTextoActivo,
                        ]}
                      >
                        {TIPO_RES_LABEL[t]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                <Input
                  label="Garrón (opcional)"
                  value={garron}
                  onChangeText={setGarron}
                />
                <Button
                  label="GUARDAR"
                  loading={guardandoRes}
                  onPress={() => void guardarRes()}
                />
                <Button
                  label="CANCELAR"
                  variant="secondary"
                  onPress={limpiarFlujoCodigo}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.seccion}>
              Otros productos (sin código de barras)
            </Text>
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
                  <Pressable
                    style={styles.productoCard}
                    onPress={() => elegirProducto(item)}
                  >
                    <Text style={styles.productoNombre}>{item.nombre}</Text>
                    <Text style={styles.productoCategoria}>
                      {item.categoria}
                    </Text>
                  </Pressable>
                )}
              />
            ) : null}
            {mensajeStock ? (
              <Text style={styles.mensaje}>{mensajeStock}</Text>
            ) : null}

            {productoSeleccionado ? (
              <View style={styles.altaBox}>
                <Text style={styles.altaTitulo}>
                  {productoSeleccionado.nombre}
                </Text>
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
                <Button
                  label="GUARDAR"
                  loading={guardandoStock}
                  onPress={() => void guardarStock()}
                />
                <Button
                  label="CANCELAR"
                  variant="secondary"
                  onPress={() => setProductoSeleccionado(null)}
                />
              </View>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    marginBottom: 12,
  },
  tropaActiva: { flexDirection: "row", alignItems: "center", gap: 12 },
  tropaNumero: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.doradoOscuro,
  },
  tropaSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
    marginTop: 2,
  },
  vacio: {
    fontFamily: "Poppins_400Regular",
    color: COLORS.grisSecundario,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.grisTexto,
    marginBottom: 8,
  },
  mensaje: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    backgroundColor: COLORS.grisClaro,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  altaBox: { gap: 4, marginTop: 4 },
  altaTitulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.doradoOscuro,
    marginBottom: 4,
  },
  tipoLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  filaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dcd2c8",
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  chipTextoActivo: { color: "#fff" },
  productoCard: {
    backgroundColor: COLORS.grisClaro,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productoNombre: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  productoCategoria: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.grisSecundario,
  },
});
