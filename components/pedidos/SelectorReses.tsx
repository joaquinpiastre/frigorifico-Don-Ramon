import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { showAlert } from "@/utils/alert";
import { BarcodeScannerModal } from "@/components/scanner/BarcodeScannerModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COLORS } from "@/constants/colors";
import { buscarResPorCodigoApi } from "@/services/stockApi";
import type { Res, TipoRes } from "@/types";

// Lo que realmente queda libre: lo que hay en stock menos lo que otros pedidos
// pendientes (aún sin armar) ya tienen anotado sobre esa misma res.
function disponibleReal(cantidadTotal: number, reservado: number): number {
  return Math.max(0, cantidadTotal - reservado);
}

interface Props {
  tipo: TipoRes;
  productoNombre: string;
  resesDelTipo: Res[];
  onConfirmar: (seleccion: { res: Res; cantidad: number }[]) => void;
  onCancelar: () => void;
}

export function SelectorReses({
  tipo,
  productoNombre,
  resesDelTipo,
  onConfirmar,
  onCancelar,
}: Props) {
  // resId -> cantidad (string editable, precargada con el disponible real al marcar)
  const [seleccion, setSeleccion] = useState<Map<number, string>>(new Map());
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const inputRef = useRef<import("react-native").TextInput>(null);

  const marcar = (res: Res) => {
    setSeleccion((prev) => {
      const next = new Map(prev);
      next.set(
        res.id,
        String(disponibleReal(res.kilosDisponibles, res.reservado)),
      );
      return next;
    });
  };

  const desmarcar = (resId: number) => {
    setSeleccion((prev) => {
      const next = new Map(prev);
      next.delete(resId);
      return next;
    });
  };

  const toggle = (res: Res) => {
    if (seleccion.has(res.id)) {
      desmarcar(res.id);
    } else {
      marcar(res);
    }
  };

  const buscarPorCodigo = async (valorManual?: string) => {
    const valor = (valorManual ?? codigo).trim();
    if (!valor || buscando) return;
    setBuscando(true);
    try {
      const res = await buscarResPorCodigoApi(valor);
      if (!res) {
        showAlert("Código no encontrado", `No hay ninguna res en stock con el código ${valor}.`);
        return;
      }
      if (res.tipo !== tipo) {
        showAlert(
          "Tipo distinto",
          `Esa res es de tipo "${res.tipo}", no corresponde a ${productoNombre}.`,
        );
        return;
      }
      if (!seleccion.has(res.id)) {
        marcar(res);
      }
    } finally {
      setCodigo("");
      setBuscando(false);
      inputRef.current?.focus();
    }
  };

  const onCodigoEscaneado = (valor: string) => {
    setMostrarCamara(false);
    void buscarPorCodigo(valor);
  };

  const resesSeleccionadas = resesDelTipo.filter((r) => seleccion.has(r.id));

  const confirmar = () => {
    if (resesSeleccionadas.length === 0) return;
    const items = resesSeleccionadas.map((res) => ({
      res,
      cantidad: Number((seleccion.get(res.id) ?? "0").replace(",", ".")),
    }));
    if (items.some((i) => !i.cantidad || i.cantidad <= 0)) {
      showAlert("Reses seleccionadas", "Revisá que todas las reses tengan un peso válido.");
      return;
    }
    onConfirmar(items);
    setSeleccion(new Map());
  };

  return (
    <View>
      <Text style={styles.subSeccion}>Escanear código de barras (Cor)</Text>
      <View style={styles.filaCodigo}>
        <View style={{ flex: 1 }}>
          <Input
            ref={inputRef}
            value={codigo}
            onChangeText={setCodigo}
            onSubmitEditing={() => void buscarPorCodigo()}
            autoFocus
            blurOnSubmit={false}
            returnKeyType="done"
            placeholder="Pistola lectora o tocá la cámara…"
          />
        </View>
        <Pressable
          style={styles.camaraBtn}
          onPress={() => setMostrarCamara(true)}
          hitSlop={8}
        >
          <Ionicons name="camera" size={22} color="#fff" />
        </Pressable>
      </View>

      <BarcodeScannerModal
        visible={mostrarCamara}
        onClose={() => setMostrarCamara(false)}
        onScanned={onCodigoEscaneado}
        titulo="Escanear Cor de la res"
      />

      <Text style={styles.subSeccion}>O marcá las reses en stock</Text>
      {resesDelTipo.length === 0 ? (
        <Text style={styles.aviso}>
          ⚠️ No tenés stock de {productoNombre} en este momento.
        </Text>
      ) : (
        <FlatList
          data={resesDelTipo}
          keyExtractor={(r) => String(r.id)}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const marcada = seleccion.has(item.id);
            return (
              <Pressable
                style={[styles.opcionCard, marcada && styles.opcionCardActiva]}
                onPress={() => toggle(item)}
              >
                <Text style={styles.opcionTexto}>
                  {marcada ? "✓ " : ""}
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
            );
          }}
        />
      )}

      {resesSeleccionadas.length > 0 ? (
        <View style={styles.seleccionadasBox}>
          <Text style={styles.subSeccion}>
            Reses seleccionadas para este pedido ({resesSeleccionadas.length})
          </Text>
          {resesSeleccionadas.map((res) => (
            <View key={res.id} style={styles.filaSeleccionada}>
              <View style={{ flex: 1 }}>
                <Text style={styles.opcionTexto}>
                  Cor {res.cor}
                  {res.garron ? ` · Garrón ${res.garron}` : ""}
                </Text>
                <Input
                  label="Peso (repesaje)"
                  value={seleccion.get(res.id) ?? ""}
                  onChangeText={(v) =>
                    setSeleccion((prev) => new Map(prev).set(res.id, v))
                  }
                  keyboardType="decimal-pad"
                />
              </View>
              <Button
                label="DESMARCAR"
                variant="secondary"
                onPress={() => desmarcar(res.id)}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Button
        label={`AGREGAR AL PEDIDO${resesSeleccionadas.length > 0 ? ` (${resesSeleccionadas.length})` : ""}`}
        onPress={confirmar}
      />
      <Button label="CANCELAR" variant="secondary" onPress={onCancelar} />
    </View>
  );
}

const styles = StyleSheet.create({
  filaCodigo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  camaraBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.negro,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  subSeccion: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.grisSecundario,
    marginTop: 4,
  },
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
  seleccionadasBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.grisClaro,
  },
  filaSeleccionada: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
});
