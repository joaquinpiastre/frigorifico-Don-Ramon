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
import { showAlert } from "@/utils/alert";
import { aInputFecha, formatoFechaCorta } from "@/utils/fecha";
import type { LoteIngreso, Res } from "@/types";

export default function TropaDetalle() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const loteIdNum = Number(loteId);

  const [lote, setLote] = useState<LoteIngreso | null>(null);
  const [reses, setReses] = useState<Res[]>([]);
  const [cargando, setCargando] = useState(true);

  const [editandoFecha, setEditandoFecha] = useState(false);
  const [fechaEditada, setFechaEditada] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      listarLotesApi(),
      listarResesApi({ loteId: loteIdNum, estado: "en_stock", limit: 500 }),
    ])
      .then(([lotes, resesData]) => {
        setLote(lotes.find((l) => l.id === loteIdNum) ?? null);
        setReses(resesData);
      })
      .catch(() => {
        setLote(null);
        setReses([]);
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

  return (
    <Screen
      title={`Tropa ${lote?.numeroTropa ?? loteIdNum}`}
      subtitle={`${reses.length} ítem(s) · ${kilosTotales.toFixed(0)} kg disponibles`}
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
      ) : reses.length === 0 ? (
        <Text style={styles.vacio}>No hay stock disponible de esta tropa.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {reses.map((res) => (
            <ResCard key={res.id} res={res} onEliminado={cargar} />
          ))}
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
