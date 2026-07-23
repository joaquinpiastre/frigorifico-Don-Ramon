import { Ionicons } from "@expo/vector-icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
// @ts-expect-error sin tipos públicos: mismo helper que usa expo-camera para
// renderizar el <video> nativo del navegador dentro de un árbol react-native-web.
import createElement from "react-native-web/dist/exports/createElement";
import { Button } from "@/components/ui/Button";
import { COLORS } from "@/constants/colors";

// Versión web: expo-camera en el navegador SOLO decodifica códigos QR (usa
// jsQR por debajo), así que para códigos de barras 1D (Code128/EAN/etc, que
// es lo que traen las etiquetas de faena) hace falta ZXing, que sí los soporta
// en cualquier navegador (Chrome, Safari, Firefox) sin depender de la API
// nativa BarcodeDetector (que Safari no implementa).
const HINTS = new Map();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
]);
HINTS.set(DecodeHintType.TRY_HARDER, true);

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const yaEscaneadoRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    yaEscaneadoRef.current = false;
    setError(null);

    const reader = new BrowserMultiFormatReader(HINTS);
    let cancelado = false;

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (resultado) => {
          if (cancelado || yaEscaneadoRef.current || !resultado) return;
          const valor = resultado.getText().trim();
          if (!valor) return;
          yaEscaneadoRef.current = true;
          onScanned(valor);
        },
      )
      .then((controls) => {
        if (cancelado) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() =>
        setError(
          "No se pudo acceder a la cámara. Revisá los permisos del navegador.",
        ),
      );

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [visible, onScanned]);

  const cerrar = () => {
    controlsRef.current?.stop();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cerrar}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Pressable onPress={cerrar} hitSlop={10} style={styles.cerrarBtn}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.videoWrap}>
          {createElement("video", {
            ref: videoRef,
            muted: true,
            playsInline: true,
            autoPlay: true,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
            },
          })}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.marco} />
            <Text style={styles.ayuda}>
              Apuntá al código de barras de la etiqueta
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.mensaje}>{error}</Text> : null}

        <View style={styles.pie}>
          <Button label="CANCELAR" variant="secondary" onPress={cerrar} />
        </View>
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
    paddingTop: 24,
    paddingBottom: 12,
  },
  titulo: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  cerrarBtn: { padding: 4 },
  videoWrap: { flex: 1, position: "relative" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  ayuda: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 170,
  },
  mensaje: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    padding: 12,
  },
  pie: { padding: 16, paddingBottom: 32 },
});
