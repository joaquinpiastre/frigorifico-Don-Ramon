import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeSettings,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";

// Tipos de código de barras habituales en etiquetas de faena/mercadería: 1D
// (Code128/39/Codabar/EAN/UPC/ITF) y QR por si algún día se usa.
// Referencia estable (fuera del componente) para no reconfigurar el escáner
// nativo en cada render, que en algunos dispositivos hace que nunca "trabe" foco.
const BARCODE_SETTINGS: BarcodeSettings = {
  barcodeTypes: [
    "code128",
    "code39",
    "code93",
    "codabar",
    "ean13",
    "ean8",
    "upc_a",
    "upc_e",
    "itf14",
    "qr",
  ],
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (codigo: string) => void;
  titulo?: string;
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
  titulo = "Escanear código",
}: Props) {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const yaEscaneadoRef = useRef(false);

  const handleScan = (resultado: BarcodeScanningResult) => {
    if (yaEscaneadoRef.current) return;
    const valor = resultado.data?.trim();
    if (!valor) return;
    yaEscaneadoRef.current = true;
    onScanned(valor);
  };

  const cerrar = () => {
    setTorch(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={cerrar}
      onShow={() => {
        yaEscaneadoRef.current = false;
      }}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Pressable onPress={cerrar} hitSlop={10} style={styles.cerrarBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        {!permiso ? (
          <View style={styles.centro}>
            <Text style={styles.mensaje}>Verificando permiso de cámara…</Text>
          </View>
        ) : !permiso.granted ? (
          <View style={styles.centro}>
            <Ionicons name="camera-outline" size={48} color="#fff" />
            <Text style={styles.mensaje}>
              Necesitamos acceso a la cámara para escanear el código de barras.
            </Text>
            <Button
              label="PERMITIR CÁMARA"
              onPress={() => void solicitarPermiso()}
            />
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camara}
              facing="back"
              enableTorch={torch}
              autofocus="on"
              barcodeScannerSettings={BARCODE_SETTINGS}
              onBarcodeScanned={handleScan}
            >
              <View style={styles.overlay}>
                <View style={styles.marco} />
                <Text style={styles.ayuda}>
                  Apuntá al código de barras de la etiqueta
                </Text>
              </View>
            </CameraView>
            <View style={styles.pie}>
              <Button
                label={torch ? "APAGAR LINTERNA" : "LINTERNA"}
                variant="secondary"
                iconLeft={
                  <Ionicons
                    name={torch ? "flash" : "flash-outline"}
                    size={18}
                    color={COLORS.negro}
                  />
                }
                onPress={() => setTorch((t) => !t)}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
  },
  titulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  cerrarBtn: { padding: 4 },
  camara: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  marco: {
    width: "78%",
    height: 140,
    borderWidth: 3,
    borderColor: COLORS.dorado,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ayuda: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pie: { padding: 16, paddingBottom: 32 },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  mensaje: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
});
