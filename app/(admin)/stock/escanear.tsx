import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { buscarResPorCodigoApi } from '@/services/stockApi';

export default function EscanearCaravana() {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [bloqueado, setBloqueado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const onCodigoLeido = async (codigo: string) => {
    if (bloqueado) return;
    setBloqueado(true);
    setMensaje(`Buscando ${codigo}…`);

    const res = await buscarResPorCodigoApi(codigo);
    if (res) {
      setMensaje(`${res.gar} · ${res.kilosDisponibles} kg disponibles`);
    } else {
      setMensaje(`Código ${codigo} no registrado. Abriendo alta de res…`);
      router.push({ pathname: '/(admin)/stock/nueva-res', params: { codigo } });
    }
  };

  if (!permiso) {
    return (
      <Screen title="Escanear caravana" scrollable>
        <Text>Cargando permisos de cámara…</Text>
      </Screen>
    );
  }

  if (!permiso.granted) {
    return (
      <Screen title="Escanear caravana" scrollable>
        <Text style={styles.aviso}>Necesitamos acceso a la cámara para leer el código de la caravana.</Text>
        <Button label="DAR PERMISO" onPress={() => void solicitarPermiso()} />
      </Screen>
    );
  }

  return (
    <Screen title="Escanear caravana" subtitle="Apuntá la cámara al código">
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'qr', 'datamatrix'] }}
          onBarcodeScanned={(result) => void onCodigoLeido(result.data)}
        />
      </View>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      {bloqueado ? (
        <Button
          label="ESCANEAR OTRA"
          variant="secondary"
          onPress={() => {
            setMensaje(null);
            setBloqueado(false);
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  aviso: { fontFamily: 'Poppins_400Regular', color: COLORS.grisTexto, marginBottom: 12 },
  cameraWrapper: { borderRadius: 16, overflow: 'hidden', height: 380 },
  camera: { flex: 1 },
  mensaje: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.grisTexto,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
