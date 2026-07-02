import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ItemStockCard } from "@/components/stock/ItemStockCard";
import { ResCard } from "@/components/stock/ResCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  actualizarLoteApi,
  eliminarLoteApi,
  listarLotesApi,
  listarResesApi,
} from "@/services/stockApi";
import { listarStockItemsApi } from "@/services/stockItemsApi";
import { showAlert, showConfirm } from "@/utils/alert";
import { aInputFecha, formatoFechaCorta } from "@/utils/fecha";
import type { ItemStock, LoteIngreso, Res } from "@/types";

export default function TropaDetalle() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const loteIdNum = Number(loteId);

  const [lote, setLote] = useState<LoteIngreso | null>(null);
  const [reses, setReses] = useState<Res[]>([]);
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);
  const [cargando, setCargando] = useState(true);

  const [eliminandoTropa, setEliminandoTropa] = useState(false);
  const [editandoFecha, setEditandoFecha] = useState(false);
  const [fechaEditada, setFechaEditada] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      listarLotesApi(),
      listarResesApi({ loteId: loteIdNum, limit: 500 }),
      listarStockItemsApi({ loteId: loteIdNum }),
    ])
      .then(([lotes, resesData, itemsData]) => {
        setLote(lotes.find((l) => l.id === loteIdNum) ?? null);
        setReses(resesData);
        setItemsStock(itemsData);
      })
      .catch(() => {
        setLote(null);
        setReses([]);
        setItemsStock([]);
      })
      .finally(() => setCargando(false));
  }, [loteIdNum]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const empezarEdicionFecha = () => {
    setFechaEditada(aInputFecha(lote?.fechaFaena));
    setEditandoFecha(true);
  };

  const eliminarTropa = async () => {
    const confirmado = await showConfirm(
      "Eliminar tropa",
      `Se va a eliminar la tropa ${lote?.numeroTropa ?? ""} y todo su contenido. Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setEliminandoTropa(true);
    try {
      await eliminarLoteApi(loteIdNum);
      router.replace("/(admin)/stock");
    } catch (e) {
      showAlert(
        "Tropa",
        e instanceof Error ? e.message : "No se pudo eliminar la tropa.",
      );
    } finally {
      setEliminandoTropa(false);
    }
  };

  const guardarFecha = async () => {
    setGuardandoFecha(true);
    try {
      await actualizarLoteApi(loteIdNum, {
        fechaFaena: fechaEditada.trim() || undefined,
      });
      setEditandoFecha(false);
      cargar();
    } catch (e) {
      showAlert(
        "Tropa",
        e instanceof Error ? e.message : "No se pudo actualizar la fecha.",
      );
    } finally {
      setGuardandoFecha(false);
    }
  };

  const resesDisponibles = reses.filter((r) => r.estado === "en_stock");
  const resesVendidas = reses.filter((r) => r.estado === "agotada");
  const itemsDisponibles = itemsStock.filter((i) => i.cantidadDisponible > 0);
  const itemsAgotados = itemsStock.filter((i) => i.cantidadDisponible === 0);
  const kilosDisponibles = resesDisponibles.reduce((acc, r) => acc + r.kilosDisponibles, 0);
  const totalIngresados = reses.length + itemsStock.length;

  return (
    <Screen
      title={`Tropa ${lote?.numeroTropa ?? loteIdNum}`}
      subtitle={`${totalIngresados} ítem(s) ingresados · ${kilosDisponibles.toFixed(0)} kg disponibles`}
      scrollable
    >
      <View style={styles.card}>
        {editandoFecha ? (
          <View style={styles.fechaEdicion}>
            <Input
              value={fechaEditada}
              onChangeText={setFechaEditada}
              placeholder="AAAA-MM-DD"
              autoCapitalize="none"
            />
            <View style={styles.fechaEdicionBotones}>
              <Button
                label="GUARDAR"
                loading={guardandoFecha}
                onPress={() => void guardarFecha()}
              />
              <Button
                label="CANCELAR"
                variant="secondary"
                onPress={() => setEditandoFecha(false)}
              />
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.fechaFila}
            onPress={empezarEdicionFecha}
            hitSlop={6}
          >
            <Text style={styles.fechaTexto}>
              Fecha: {formatoFechaCorta(lote?.fechaFaena)}
            </Text>
            <Ionicons name="pencil" size={14} color={COLORS.grisSecundario} />
          </Pressable>
        )}
        {lote?.dte ? <Text style={styles.dato}>DTe: {lote.dte}</Text> : null}
        {lote?.establecimiento ? (
          <Text style={styles.dato}>
            Establecimiento: {lote.establecimiento}
          </Text>
        ) : null}
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : totalIngresados === 0 ? (
        <Text style={styles.vacio}>No se cargó nada en esta tropa.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {/* — Reses disponibles — */}
          {resesDisponibles.length > 0 ? (
            <>
              <Text style={styles.seccion}>Reses en stock</Text>
              {resesDisponibles.map((res) => (
                <ResCard key={res.id} res={res} onEliminado={cargar} />
              ))}
            </>
          ) : null}

          {/* — Items disponibles — */}
          {itemsDisponibles.length > 0 ? (
            <>
              <Text style={styles.seccion}>Otros productos en stock</Text>
              {itemsDisponibles.map((item) => (
                <ItemStockCard key={item.id} item={item} />
              ))}
            </>
          ) : null}

          {/* — Vendido / agotado — */}
          {(resesVendidas.length > 0 || itemsAgotados.length > 0) ? (
            <>
              <Text style={[styles.seccion, styles.seccionVendido]}>
                Ya vendido de esta tropa
              </Text>
              {resesVendidas.map((res) => (
                <View key={res.id} style={styles.cardVendido}>
                  <Text style={styles.vendidoNombre}>
                    Cor {res.cor}{res.garron ? ` · Garrón ${res.garron}` : ""}
                  </Text>
                  <Text style={styles.vendidoSub}>
                    {res.kilosIngreso} kg ingresados · agotada
                  </Text>
                </View>
              ))}
              {itemsAgotados.map((item) => (
                <View key={item.id} style={styles.cardVendido}>
                  <Text style={styles.vendidoNombre}>{item.productoNombre}</Text>
                  <Text style={styles.vendidoSub}>
                    {item.cantidad} {item.unidad} ingresados · agotado
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      )}

      <Button
        label="AGREGAR RES A ESTA TROPA"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/(admin)/stock/nueva-res",
            params: { loteId: String(loteIdNum) },
          })
        }
      />
      <Button
        label="ELIMINAR TROPA"
        variant="danger"
        loading={eliminandoTropa}
        onPress={() => void eliminarTropa()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: {
    fontFamily: "Poppins_400Regular",
    color: COLORS.grisSecundario,
    marginTop: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.grisTexto,
    marginTop: 4,
  },
  seccionVendido: {
    color: COLORS.grisSecundario,
    marginTop: 12,
  },
  cardVendido: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    gap: 3,
    opacity: 0.7,
  },
  vendidoNombre: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisSecundario,
    textDecorationLine: "line-through",
  },
  vendidoSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.grisSecundario,
  },
  fechaFila: { flexDirection: "row", alignItems: "center", gap: 6 },
  fechaTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  fechaEdicion: { gap: 6 },
  fechaEdicionBotones: { flexDirection: "row", gap: 8 },
  dato: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
});
