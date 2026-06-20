import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { cerrarCargaApi, crearCargaApi, escanearItemCargaApi } from '@/services/cargasApi';
import type { CargaItem } from '@/types';

const COOLDOWN_MS = 2500;

export default function NuevaCargaReparto() {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [cargaId, setCargaId] = useState<number | null>(null);
  const [items, setItems] = useState<CargaItem[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const ultimoEscaneo = useRef<{ cor: string; en: number } | null>(null);

  useEffect(() => {
    crearCargaApi()
      .then((carga) => setCargaId(carga.id))
      .catch(() => Alert.alert('Carga', 'No se pudo abrir la carga de reparto.'));
  }, []);

  const onCodigoLeido = async (cor: string) => {
    if (!cargaId || procesando) return;
    const ahora = Date.now();
    if (ultimoEscaneo.current?.cor === cor && ahora - ultimoEscaneo.current.en < COOLDOWN_MS) return;
    ultimoEscaneo.current = { cor, en: ahora };

    setProcesando(true);
    try {
      const item = await escanearItemCargaApi(cargaId, cor);
      setItems((prev) => [item, ...prev]);
      setMensaje(`✓ Garrón ${item.garron ?? '–'} · ${item.kilosDisponibles} kg`);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo agregar esa res.');
    } finally {
      setProcesando(false);
    }
  };

  const finalizarCarga = async () => {
    if (!cargaId) return;
    setFinalizando(true);
    try {
      await cerrarCargaApi(cargaId);
      const totalKilos = items.reduce((acc, i) => acc + i.kilosDisponibles, 0);
      Alert.alert('Carga finalizada', `${items.length} piezas · ${totalKilos.toFixed(0)} kg en total.`);
      router.replace('/(admin)');
    } catch (e) {
      Alert.alert('Carga', e instanceof Error ? e.message : 'No se pudo finalizar la carga.');
    } finally {
      setFinalizando(false);
    }
  };

  if (!permiso) {
    return (
      <Screen title="Carga de reparto" scrollable>
        <Text>Cargando permisos de cámara…</Text>
      </Screen>
    );
  }

  if (!permiso.granted) {
    return (
      <Screen title="Carga de reparto" scrollable>
        <Text style={styles.aviso}>Necesitamos acceso a la cámara para leer las etiquetas.</Text>
        <Button label="DAR PERMISO" onPress={() => void solicitarPermiso()} />
      </Screen>
    );
  }

  return (
    <Screen title="Carga de reparto" subtitle="Escaneá cada res que sube a la camioneta">
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'qr', 'datamatrix'] }}
          onBarcodeScanned={(result) => void onCodigoLeido(result.data)}
        />
      </View>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

      <Text style={styles.contador}>{items.length} piezas cargadas</Text>
      {items.map((i) => (
        <View key={i.id} style={styles.card}>
          <Text style={styles.itemTexto}>
            Garrón {i.garron ?? '–'} · {i.clasificacion ?? '–'}
          </Text>
          <Text style={styles.itemKilos}>{i.kilosDisponibles} kg</Text>
        </View>
      ))}

      <Button label="FINALIZAR CARGA" variant="secondary" loading={finalizando} onPress={() => void finalizarCarga()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  aviso: { fontFamily: 'Poppins_400Regular', color: COLORS.grisTexto, marginBottom: 12 },
  cameraWrapper: { borderRadius: 16, overflow: 'hidden', height: 300 },
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
  contador: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: COLORS.grisTexto,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto, flexShrink: 1 },
  itemKilos: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: COLORS.doradoOscuro },
});
