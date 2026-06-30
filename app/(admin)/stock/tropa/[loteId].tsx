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
  listarLotesApi,
  listarResesApi,
} from "@/services/stockApi";
import { listarStockItemsApi } from "@/services/stockItemsApi";
import { showAlert } from "@/utils/alert";
import { aInputFecha, formatoFechaCorta } from "@/utils/fecha";
import type { ItemStock, LoteIngreso, Res } from "@/types";

export default function TropaDetalle() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const loteIdNum = Number(loteId);

  const [lote, setLote] = useState<LoteIngreso | null>(null);
  const [reses, setReses] = useState<Res[]>([]);
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editandoFecha, setEditandoFecha] = useState(false);
  const [fechaEditada, setFechaEditada] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      listarLotesApi(),
      listarResesApi({ loteId: loteIdNum, estado: "en_stock", limit: 500 }),
      listarStockItemsApi({ loteId: loteIdNum }),
    ])
      .then(([lotes, resesData, itemsData]) => {
        setLote(lotes.find((l) => l.id === loteIdNum) ?? null);
        setReses(resesData);
        setItemsStock(itemsData.filter((i) => i.cantidadDisponible > 0));
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

  const kilosTotales = reses.reduce((acc, r) => acc + r.kilosDisponibles, 0);
  const totalItems = reses.length + itemsStock.length;

  return (
    <Screen
      title={`Tropa ${lote?.numeroTropa ?? loteIdNum}`}
      subtitle={`${totalItems} ítem(s) · ${kilosTotales.toFixed(0)} kg de carne disponibles`}
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
      ) : totalItems === 0 ? (
        <Text style={styles.vacio}>No hay stock disponible de esta tropa.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {reses.length > 0 ? (
            <>
              <Text style={styles.seccion}>Reses</Text>
              {reses.map((res) => (
                <ResCard key={res.id} res={res} onEliminado={cargar} />
              ))}
            </>
          ) : null}

          {itemsStock.length > 0 ? (
            <>
              <Text style={styles.seccion}>Otros productos</Text>
              {itemsStock.map((item) => (
                <ItemStockCard key={item.id} item={item} />
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
