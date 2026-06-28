import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { listarLotesApi, listarResesApi } from "@/services/stockApi";
import { formatoFechaCorta } from "@/utils/fecha";
import type { LoteIngreso, Res } from "@/types";

const DEBOUNCE_MS = 350;

export default function StockIndex() {
  const [reses, setReses] = useState<Res[]>([]);
  const [lotes, setLotes] = useState<LoteIngreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setBusquedaActiva(busqueda.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      listarResesApi({
        estado: "en_stock",
        q: busquedaActiva || undefined,
        limit: 200,
      }),
      listarLotesApi(),
    ])
      .then(([resesData, lotesData]) => {
        setReses(resesData);
        setLotes(lotesData);
      })
      .catch(() => {
        setReses([]);
        setLotes([]);
      })
      .finally(() => setCargando(false));
  }, [busquedaActiva]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const grupos = useMemo(() => {
    const porLote = new Map<number, Res[]>();
    for (const res of reses) {
      const lista = porLote.get(res.loteId) ?? [];
      lista.push(res);
      porLote.set(res.loteId, lista);
    }
    return Array.from(porLote.entries())
      .map(([loteId, items]) => ({
        lote: lotes.find((l) => l.id === loteId) ?? null,
        loteId,
        items,
      }))
      .sort((a, b) => b.loteId - a.loteId);
  }, [reses, lotes]);

  const kilosTotales = reses.reduce((acc, r) => acc + r.kilosDisponibles, 0);
  const hayBusqueda = busquedaActiva.length > 0;

  return (
    <Screen title="Stock" subtitle="Stock disponible" scrollable>
      <Button
        label="ESCANEAR ETIQUETA"
        onPress={() => router.push("/(admin)/stock/escanear")}
      />
      <Button
        label="ALTA MANUAL"
        variant="secondary"
        onPress={() => router.push("/(admin)/stock/nueva-res")}
      />

      <Input
        placeholder="Buscar por Cor, garrón o clasificación…"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>{reses.length} ítems</Text>
        <Text style={styles.resumenTexto}>
          {kilosTotales.toFixed(0)} kg disponibles
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : grupos.length === 0 ? (
        <Text style={styles.vacio}>
          {hayBusqueda
            ? `Sin resultados para "${busquedaActiva}".`
            : "No hay stock disponible."}
        </Text>
      ) : hayBusqueda ? (
        // Con búsqueda activa mostramos las reses encontradas directamente, agrupadas por tropa.
        grupos.map(({ lote, loteId, items }) => (
          <View key={loteId} style={styles.grupo}>
            <Text style={styles.tropaNumeroChico}>
              Tropa {lote?.numeroTropa ?? loteId}
            </Text>
            {items.map((res) => (
              <ResCard key={res.id} res={res} onEliminado={cargar} />
            ))}
          </View>
        ))
      ) : (
        // Sin búsqueda: solo el resumen de cada tropa; tocarla abre su stock.
        grupos.map(({ lote, loteId, items }) => {
          const kilosTropa = items.reduce(
            (acc, r) => acc + r.kilosDisponibles,
            0,
          );
          return (
            <Pressable
              key={loteId}
              style={styles.tropaCard}
              onPress={() => router.push(`/(admin)/stock/tropa/${loteId}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.tropaNumero}>
                  Tropa {lote?.numeroTropa ?? loteId}
                </Text>
                <Text style={styles.tropaFecha}>
                  {formatoFechaCorta(lote?.fechaFaena)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.tropaResumen}>
                  {items.length} ítem(s) · {kilosTropa.toFixed(0)} kg
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.dorado}
                />
              </View>
            </Pressable>
          );
        })
      )}
      {reses.length === 200 ? (
        <Text style={styles.aviso}>
          Mostrando los primeros 200 resultados. Afiná la búsqueda para ver más.
        </Text>
      ) : null}
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
  aviso: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
    textAlign: "center",
    marginTop: 8,
  },
  resumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  resumenTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
  grupo: { marginBottom: 16, gap: 8 },
  tropaNumeroChico: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
  tropaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.negro,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  tropaNumero: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.dorado,
  },
  tropaFecha: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  tropaResumen: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.doradoClaro,
  },
});
