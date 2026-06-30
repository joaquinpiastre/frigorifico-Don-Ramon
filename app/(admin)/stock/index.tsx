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
import { ItemStockCard } from "@/components/stock/ItemStockCard";
import { ResCard } from "@/components/stock/ResCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import { listarLotesApi, listarResesApi } from "@/services/stockApi";
import { listarStockItemsApi } from "@/services/stockItemsApi";
import { formatoFechaCorta } from "@/utils/fecha";
import type { ItemStock, LoteIngreso, Res } from "@/types";

const DEBOUNCE_MS = 350;
const SIN_TROPA = -1;

export default function StockIndex() {
  const [reses, setReses] = useState<Res[]>([]);
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);
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
      listarStockItemsApi(),
      listarLotesApi(),
    ])
      .then(([resesData, itemsData, lotesData]) => {
        setReses(resesData);
        setItemsStock(itemsData.filter((i) => i.cantidadDisponible > 0));
        setLotes(lotesData);
      })
      .catch(() => {
        setReses([]);
        setItemsStock([]);
        setLotes([]);
      })
      .finally(() => setCargando(false));
  }, [busquedaActiva]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const itemsStockFiltrados = useMemo(() => {
    const q = busquedaActiva.trim().toLowerCase();
    if (!q) return itemsStock;
    return itemsStock.filter((i) => i.productoNombre.toLowerCase().includes(q));
  }, [itemsStock, busquedaActiva]);

  const grupos = useMemo(() => {
    const porLote = new Map<number, { reses: Res[]; items: ItemStock[] }>();
    const obtener = (loteId: number) => {
      let g = porLote.get(loteId);
      if (!g) {
        g = { reses: [], items: [] };
        porLote.set(loteId, g);
      }
      return g;
    };
    for (const res of reses) obtener(res.loteId).reses.push(res);
    for (const item of itemsStockFiltrados)
      obtener(item.loteId ?? SIN_TROPA).items.push(item);

    return Array.from(porLote.entries())
      .map(([loteId, g]) => ({
        lote:
          loteId === SIN_TROPA
            ? null
            : (lotes.find((l) => l.id === loteId) ?? null),
        loteId,
        ...g,
      }))
      .sort((a, b) => b.loteId - a.loteId);
  }, [reses, itemsStockFiltrados, lotes]);

  const kilosTotales = reses.reduce((acc, r) => acc + r.kilosDisponibles, 0);
  const hayBusqueda = busquedaActiva.length > 0;
  const hayResultados = grupos.length > 0;

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
        placeholder="Buscar por Cor, garrón, clasificación o producto…"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>
          {reses.length + itemsStock.length} ítems
        </Text>
        <Text style={styles.resumenTexto}>
          {kilosTotales.toFixed(0)} kg de carne disponibles
        </Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : !hayResultados ? (
        <Text style={styles.vacio}>
          {hayBusqueda
            ? `Sin resultados para "${busquedaActiva}".`
            : "No hay stock disponible."}
        </Text>
      ) : hayBusqueda ? (
        // Con búsqueda activa mostramos lo encontrado directamente, agrupado por tropa.
        grupos.map(({ lote, loteId, reses: resesGrupo, items }) => (
          <View key={loteId} style={styles.grupo}>
            <Text style={styles.tropaNumeroChico}>
              {loteId === SIN_TROPA
                ? "Sin tropa asignada"
                : `Tropa ${lote?.numeroTropa ?? loteId}`}
            </Text>
            {resesGrupo.map((res) => (
              <ResCard key={`res-${res.id}`} res={res} onEliminado={cargar} />
            ))}
            {items.map((item) => (
              <ItemStockCard key={`item-${item.id}`} item={item} />
            ))}
          </View>
        ))
      ) : (
        // Sin búsqueda: solo el resumen de cada tropa; tocarla abre su stock completo.
        grupos.map(({ lote, loteId, reses: resesGrupo, items }) => {
          const kilosTropa = resesGrupo.reduce(
            (acc, r) => acc + r.kilosDisponibles,
            0,
          );
          const totalItems = resesGrupo.length + items.length;
          return (
            <Pressable
              key={loteId}
              style={styles.tropaCard}
              onPress={() =>
                loteId === SIN_TROPA
                  ? null
                  : router.push(`/(admin)/stock/tropa/${loteId}`)
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.tropaNumero}>
                  {loteId === SIN_TROPA
                    ? "Sin tropa asignada"
                    : `Tropa ${lote?.numeroTropa ?? loteId}`}
                </Text>
                {loteId !== SIN_TROPA ? (
                  <Text style={styles.tropaFecha}>
                    {formatoFechaCorta(lote?.fechaFaena)}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.tropaResumen}>
                  {totalItems} ítem(s)
                  {resesGrupo.length > 0
                    ? ` · ${kilosTropa.toFixed(0)} kg`
                    : ""}
                  {items.length > 0
                    ? ` · ${items.length} producto(s) sin código`
                    : ""}
                </Text>
                {loteId !== SIN_TROPA ? (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.dorado}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
      {reses.length === 200 ? (
        <Text style={styles.aviso}>
          Mostrando los primeros 200 resultados de reses. Afiná la búsqueda para
          ver más.
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
    textAlign: "right",
  },
});
