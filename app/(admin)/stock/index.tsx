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
import { showAlert, showConfirm } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  actualizarLoteApi,
  eliminarResApi,
  listarLotesApi,
  listarResesApi,
} from "@/services/stockApi";
import type { LoteIngreso, Res } from "@/types";

const DEBOUNCE_MS = 350;

export default function StockIndex() {
  const [reses, setReses] = useState<Res[]>([]);
  const [lotes, setLotes] = useState<LoteIngreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaActiva, setBusquedaActiva] = useState("");

  const [loteEditando, setLoteEditando] = useState<number | null>(null);
  const [fechaEditada, setFechaEditada] = useState("");
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

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

  const empezarEdicionFecha = (lote: LoteIngreso) => {
    setLoteEditando(lote.id);
    setFechaEditada(lote.fechaFaena ?? "");
  };

  const guardarFecha = async (loteId: number) => {
    setGuardandoFecha(true);
    try {
      await actualizarLoteApi(loteId, {
        fechaFaena: fechaEditada.trim() || undefined,
      });
      setLoteEditando(null);
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

  const eliminarRes = async (res: Res) => {
    const confirmado = await showConfirm(
      "Eliminar del stock",
      `Cor ${res.cor}${res.garron ? ` · Garrón ${res.garron}` : ""}. Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setEliminandoId(res.id);
    try {
      await eliminarResApi(res.id);
      cargar();
    } catch (e) {
      showAlert(
        "Eliminar",
        e instanceof Error ? e.message : "No se pudo eliminar.",
      );
    } finally {
      setEliminandoId(null);
    }
  };

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
          {busquedaActiva
            ? `Sin resultados para "${busquedaActiva}".`
            : "No hay stock disponible."}
        </Text>
      ) : (
        grupos.map(({ lote, loteId, items }) => {
          const kilosTropa = items.reduce(
            (acc, r) => acc + r.kilosDisponibles,
            0,
          );
          return (
            <View key={loteId} style={styles.grupo}>
              <View style={styles.grupoHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tropaNumero}>
                    Tropa {lote?.numeroTropa ?? loteId}
                  </Text>
                  {loteEditando === lote?.id ? (
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
                          onPress={() => void guardarFecha(lote.id)}
                        />
                        <Button
                          label="CANCELAR"
                          variant="secondary"
                          onPress={() => setLoteEditando(null)}
                        />
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.fechaFila}
                      onPress={() => lote && empezarEdicionFecha(lote)}
                      hitSlop={6}
                    >
                      <Text style={styles.tropaFecha}>
                        {lote?.fechaFaena ?? "Sin fecha"}
                      </Text>
                      <Ionicons
                        name="pencil"
                        size={13}
                        color={COLORS.grisSecundario}
                      />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.tropaResumen}>
                  {items.length} ítem(s) · {kilosTropa.toFixed(0)} kg
                </Text>
              </View>

              {items.map((res) => (
                <View key={res.id} style={styles.card}>
                  <Pressable
                    style={styles.cardTexto}
                    onPress={() => router.push(`/(admin)/stock/${res.id}`)}
                  >
                    <Text style={styles.cor}>Cor {res.cor}</Text>
                    <Text style={styles.detalle}>
                      {res.garron ? `Garrón ${res.garron} · ` : ""}
                      {res.clasificacion ?? "–"}
                    </Text>
                    <Text style={styles.kilos}>
                      {res.kilosDisponibles} kg disponibles de{" "}
                      {res.kilosIngreso} kg
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.eliminarBtn}
                    onPress={() => void eliminarRes(res)}
                    disabled={eliminandoId === res.id}
                    hitSlop={8}
                  >
                    {eliminandoId === res.id ? (
                      <ActivityIndicator size="small" color={COLORS.error} />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={COLORS.error}
                      />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
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
  grupoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: COLORS.negro,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  tropaNumero: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.dorado,
  },
  fechaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  tropaFecha: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  fechaEdicion: { marginTop: 6, gap: 6 },
  fechaEdicionBotones: { flexDirection: "row", gap: 8 },
  tropaResumen: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.doradoClaro,
    textAlign: "right",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTexto: { flex: 1, gap: 4 },
  cor: { fontFamily: "Poppins_700Bold", fontSize: 15, color: COLORS.grisTexto },
  detalle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  kilos: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.doradoOscuro,
  },
  eliminarBtn: { padding: 6 },
});
