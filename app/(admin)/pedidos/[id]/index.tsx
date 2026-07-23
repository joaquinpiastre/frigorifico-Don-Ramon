import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { showAlert, showConfirm } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  obtenerPedidoApi,
  reasignarRepartidorApi,
  repesarItemApi,
} from "@/services/pedidosApi";
import { listarUsuariosApi } from "@/services/usuariosApi";
import { ESTADO_PEDIDO_LABEL, type PedidoDetalle, type UsuarioAdmin } from "@/types";

export default function PedidoDetalleAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [repartidores, setRepartidores] = useState<UsuarioAdmin[]>([]);
  const [reasignando, setReasignando] = useState(false);
  const [repesajes, setRepesajes] = useState<Record<number, string>>({});
  const [guardandoRepesajeId, setGuardandoRepesajeId] = useState<number | null>(
    null,
  );

  const cargar = useCallback(() => {
    obtenerPedidoApi(Number(id))
      .then((p) => {
        setPedido(p);
        setRepesajes((prev) => {
          const next = { ...prev };
          for (const item of p.items) {
            if (item.resId && next[item.id] === undefined) {
              next[item.id] = String(item.cantidad);
            }
          }
          return next;
        });
      })
      .catch(() => setPedido(null));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  useEffect(() => {
    listarUsuariosApi()
      .then((us) => setRepartidores(us.filter((u) => u.rol === "repartidor" && u.activo)))
      .catch(() => setRepartidores([]));
  }, []);

  if (!pedido) {
    return (
      <Screen title="Pedido" subtitle="" scrollable>
        <Text style={styles.sub}>Cargando…</Text>
      </Screen>
    );
  }

  const total = pedido.items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);

  const reasignarRepartidor = async (repartidorId: string) => {
    if (repartidorId === pedido.repartidor) return;
    setReasignando(true);
    try {
      await reasignarRepartidorApi(pedido.id, repartidorId);
      cargar();
    } catch (e) {
      showAlert(
        "Pedido",
        e instanceof Error ? e.message : "No se pudo reasignar el repartidor.",
      );
    } finally {
      setReasignando(false);
    }
  };

  const guardarRepesaje = async (itemId: number) => {
    const pesoReal = Number((repesajes[itemId] ?? "").replace(",", "."));
    if (!pesoReal || pesoReal <= 0) {
      showAlert("Repesaje", "Ingresá un peso válido.");
      return;
    }
    if (pedido.estado === "entregado") {
      const confirmado = await showConfirm(
        "Corregir remito entregado",
        "Este pedido ya está entregado y puede afectar la cuenta corriente cerrada con el cliente. ¿Confirmás la corrección de peso?",
      );
      if (!confirmado) return;
    }
    setGuardandoRepesajeId(itemId);
    try {
      await repesarItemApi(pedido.id, itemId, pesoReal);
      cargar();
    } catch (e) {
      showAlert(
        "Repesaje",
        e instanceof Error ? e.message : "No se pudo guardar el repesaje.",
      );
    } finally {
      setGuardandoRepesajeId(null);
    }
  };

  return (
    <Screen
      title={pedido.clienteNombre}
      subtitle={ESTADO_PEDIDO_LABEL[pedido.estado]}
      scrollable
    >
      <View style={styles.card}>
        <Text style={styles.sub}>Remito N° {pedido.numeroRemito}</Text>
        <Text style={styles.sub}>
          Repartidor: {pedido.repartidorNombre ?? pedido.repartidor}
        </Text>
        {pedido.items.map((item) => (
          <View key={item.id} style={styles.lineaCard}>
            <Text style={styles.linea}>
              {item.productoNombre} · {item.cantidad} × ${item.precio} = $
              {(item.cantidad * item.precio).toFixed(2)}
            </Text>
            {item.garron || item.tropa || item.cor ? (
              <Text style={styles.sub}>
                {item.cor ? `Cor ${item.cor} · ` : ""}
                {item.garron ? `Garrón ${item.garron} · ` : ""}
                {item.tropa ? `Tropa ${item.tropa}` : ""}
              </Text>
            ) : null}
            {item.nota ? <Text style={styles.sub}>📝 {item.nota}</Text> : null}
            {item.resId ? (
              <View style={styles.repesajeRow}>
                <Text style={styles.repesajeLabel}>Corregir peso (kg):</Text>
                <TextInput
                  style={styles.repesajeInput}
                  value={repesajes[item.id] ?? String(item.cantidad)}
                  onChangeText={(v) =>
                    setRepesajes((prev) => ({ ...prev, [item.id]: v }))
                  }
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Button
                  label="GUARDAR"
                  variant="secondary"
                  loading={guardandoRepesajeId === item.id}
                  onPress={() => void guardarRepesaje(item.id)}
                />
              </View>
            ) : null}
          </View>
        ))}
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>

      {pedido.estado === "armado" ? (
        <View style={styles.card}>
          <Text style={styles.seccion}>Reasignar repartidor</Text>
          <View style={styles.fila}>
            {repartidores.map((r) => (
              <Pressable
                key={r.id}
                style={[
                  styles.chip,
                  pedido.repartidor === r.id && styles.chipActivo,
                ]}
                onPress={() => void reasignarRepartidor(r.id)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    pedido.repartidor === r.id && styles.chipTextoActivo,
                  ]}
                >
                  {r.nombre}
                </Text>
              </Pressable>
            ))}
          </View>
          {reasignando ? <Text style={styles.sub}>Guardando…</Text> : null}
        </View>
      ) : null}

      <Button
        label="GENERAR REMITO"
        onPress={() => router.push(`/(admin)/pedidos/${pedido.id}/remito`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  lineaCard: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grisClaro,
  },
  linea: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
  total: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: COLORS.doradoOscuro,
    textAlign: "right",
    marginTop: 6,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: COLORS.grisTexto,
  },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  repesajeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  repesajeLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisTexto,
  },
  repesajeInput: {
    borderWidth: 1,
    borderColor: COLORS.doradoOscuro,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    minWidth: 72,
    textAlign: "center",
  },
});
