import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { showAlert, showConfirm } from "@/utils/alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { COLORS } from "@/constants/colors";
import {
  actualizarProductoApi,
  crearProductoApi,
  eliminarProductoApi,
  listarProductosApi,
} from "@/services/productosApi";
import type { CategoriaProducto, Producto, UnidadProducto } from "@/types";

const CATEGORIAS: CategoriaProducto[] = [
  "vacuno",
  "cerdo",
  "toro",
  "embutido",
  "otro",
];
const CATEGORIA_LABEL: Record<CategoriaProducto, string> = {
  vacuno: "Vacuno",
  cerdo: "Cerdo",
  toro: "Toro",
  embutido: "Embutido",
  otro: "Otro",
};
const UNIDADES: UnidadProducto[] = ["kg", "unidad"];

export default function ProductosIndex() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProducto>("vacuno");
  const [unidad, setUnidad] = useState<UnidadProducto>("kg");
  const [tieneCodigoBarra, setTieneCodigoBarra] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    listarProductosApi({ incluirInactivos: true })
      .then(setProductos)
      .catch(() => setProductos([]));
  }, []);

  useFocusEffect(cargar);

  const limpiarFormulario = () => {
    setCreando(false);
    setEditandoId(null);
    setNombre("");
    setCategoria("vacuno");
    setUnidad("kg");
    setTieneCodigoBarra(false);
  };

  const empezarCreacion = () => {
    limpiarFormulario();
    setCreando(true);
  };

  const empezarEdicion = (p: Producto) => {
    setCreando(false);
    setEditandoId(p.id);
    setNombre(p.nombre);
    setCategoria(p.categoria);
    setUnidad(p.unidad);
    setTieneCodigoBarra(p.tieneCodigoBarra);
  };

  const guardarProducto = async () => {
    if (!nombre.trim()) {
      showAlert("Producto", "El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarProductoApi(editandoId, {
          nombre: nombre.trim(),
          categoria,
          unidad,
          tieneCodigoBarra,
        });
      } else {
        await crearProductoApi({
          nombre: nombre.trim(),
          categoria,
          unidad,
          tieneCodigoBarra,
        });
      }
      limpiarFormulario();
      cargar();
    } catch (e) {
      showAlert(
        "Producto",
        e instanceof Error ? e.message : "No se pudo guardar el producto.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (p: Producto) => {
    try {
      await actualizarProductoApi(p.id, { activo: !p.activo });
      cargar();
    } catch (e) {
      showAlert(
        "Producto",
        e instanceof Error ? e.message : "No se pudo actualizar el producto.",
      );
    }
  };

  const eliminarProducto = async (p: Producto) => {
    const confirmado = await showConfirm(
      "Eliminar producto",
      `"${p.nombre}" se va a borrar del catálogo.`,
    );
    if (!confirmado) return;
    setEliminandoId(p.id);
    try {
      await eliminarProductoApi(p.id);
      cargar();
    } catch (e) {
      showAlert(
        "Producto",
        e instanceof Error ? e.message : "No se pudo eliminar.",
      );
    } finally {
      setEliminandoId(null);
    }
  };

  const formularioAbierto = creando || editandoId !== null;

  return (
    <Screen title="Productos" subtitle="Catálogo de mercadería" scrollable>
      {!formularioAbierto ? (
        <Button label="NUEVO PRODUCTO" onPress={empezarCreacion} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.seccion}>
            {editandoId ? "Editar producto" : "Nuevo producto"}
          </Text>
          <Input
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Chorizo parrillero"
          />
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.fila}>
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, categoria === c && styles.chipActivo]}
                onPress={() => setCategoria(c)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    categoria === c && styles.chipTextoActivo,
                  ]}
                >
                  {CATEGORIA_LABEL[c]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Unidad</Text>
          <View style={styles.fila}>
            {UNIDADES.map((u) => (
              <Pressable
                key={u}
                style={[styles.chip, unidad === u && styles.chipActivo]}
                onPress={() => setUnidad(u)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    unidad === u && styles.chipTextoActivo,
                  ]}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.fila}
            onPress={() => setTieneCodigoBarra((v) => !v)}
          >
            <View
              style={[
                styles.checkbox,
                tieneCodigoBarra && styles.checkboxActivo,
              ]}
            />
            <Text style={styles.label}>Tiene código de barras</Text>
          </Pressable>
          <Button
            label={editandoId ? "GUARDAR CAMBIOS" : "GUARDAR PRODUCTO"}
            loading={guardando}
            onPress={() => void guardarProducto()}
          />
          <Button
            label="CANCELAR"
            variant="secondary"
            onPress={limpiarFormulario}
          />
        </View>
      )}

      <Text style={styles.seccion}>Catálogo</Text>
      {productos.map((p) => (
        <View
          key={p.id}
          style={[styles.card, !p.activo && styles.cardInactiva]}
        >
          <Text style={styles.nombre}>
            {p.nombre}
            {!p.activo ? " (inactivo)" : ""}
          </Text>
          <Text style={styles.sub}>
            {CATEGORIA_LABEL[p.categoria]} · {p.unidad}{" "}
            {p.tieneCodigoBarra ? "· con código de barras" : ""}
          </Text>
          <View style={styles.filaBotones}>
            <View style={{ flex: 1 }}>
              <Button
                label="EDITAR"
                variant="secondary"
                onPress={() => empezarEdicion(p)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={p.activo ? "DESACTIVAR" : "ACTIVAR"}
                variant="secondary"
                onPress={() => void toggleActivo(p)}
              />
            </View>
          </View>
          <Button
            label="ELIMINAR"
            variant="danger"
            loading={eliminandoId === p.id}
            onPress={() => void eliminarProducto(p)}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  cardInactiva: { opacity: 0.6 },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
    marginBottom: 6,
  },
  fila: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  filaBotones: { flexDirection: "row", gap: 8 },
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#dcd2c8",
  },
  checkboxActivo: {
    backgroundColor: COLORS.dorado,
    borderColor: COLORS.dorado,
  },
  seccion: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
    marginTop: 8,
  },
  nombre: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.grisTexto,
  },
  sub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.grisSecundario,
  },
});
