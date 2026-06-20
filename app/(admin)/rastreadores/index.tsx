import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { crearDispositivoGpsApi, eliminarDispositivoGpsApi, listarDispositivosGpsApi } from '@/services/gpsApi';
import { useAppStore } from '@/store/useAppStore';
import type { DispositivoGps } from '@/types';

function haceCuanto(timestampMs: number | null): string {
  if (!timestampMs) return 'sin contacto todavía';
  const minutos = Math.floor((Date.now() - timestampMs) / 60_000);
  if (minutos < 1) return 'hace instantes';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `hace ${horas} h`;
}

export default function RastreadoresIndex() {
  const usuarioActual = useAppStore((s) => s.usuario);

  const [dispositivos, setDispositivos] = useState<DispositivoGps[]>([]);
  const [creando, setCreando] = useState(false);
  const [imei, setImei] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [unidadNombre, setUnidadNombre] = useState('');
  const [nombreTracker, setNombreTracker] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuarioActual && usuarioActual.rol !== 'admin') {
      router.replace('/(admin)');
    }
  }, [usuarioActual]);

  useFocusEffect(
    useCallback(() => {
      listarDispositivosGpsApi().then(setDispositivos).catch(() => setDispositivos([]));
    }, [])
  );

  if (usuarioActual && usuarioActual.rol !== 'admin') {
    return null;
  }

  const guardarDispositivo = async () => {
    if (!/^\d{15}$/.test(imei.trim())) {
      Alert.alert('Rastreador', 'El IMEI debe tener 15 dígitos.');
      return;
    }
    if (!unidadId.trim() || !unidadNombre.trim() || !nombreTracker.trim()) {
      Alert.alert('Rastreador', 'Completá el ID, el nombre del camión y el nombre del tracker.');
      return;
    }
    setGuardando(true);
    try {
      await crearDispositivoGpsApi({
        imei: imei.trim(),
        unidadId: unidadId.trim(),
        unidadNombre: unidadNombre.trim(),
        nombreTracker: nombreTracker.trim(),
      });
      setImei('');
      setUnidadId('');
      setUnidadNombre('');
      setNombreTracker('');
      setCreando(false);
      listarDispositivosGpsApi().then(setDispositivos).catch(() => undefined);
    } catch (e) {
      Alert.alert('Rastreador', e instanceof Error ? e.message : 'No se pudo guardar el rastreador.');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (d: DispositivoGps) => {
    try {
      await eliminarDispositivoGpsApi(d.imei);
      listarDispositivosGpsApi().then(setDispositivos).catch(() => undefined);
    } catch (e) {
      Alert.alert('Rastreador', e instanceof Error ? e.message : 'No se pudo desactivar el rastreador.');
    }
  };

  return (
    <Screen title="Rastreadores" subtitle="Trackers GPS de los camiones" scrollable>
      {!creando ? (
        <Button label="NUEVO RASTREADOR" onPress={() => setCreando(true)} />
      ) : (
        <View style={styles.card}>
          <Input label="IMEI (15 dígitos)" value={imei} onChangeText={setImei} keyboardType="number-pad" maxLength={15} />
          <Input label="ID de la unidad (ej. camion-1)" value={unidadId} onChangeText={setUnidadId} autoCapitalize="none" />
          <Input label="Nombre del camión" value={unidadNombre} onChangeText={setUnidadNombre} />
          <Input label="Nombre del tracker" value={nombreTracker} onChangeText={setNombreTracker} />
          <Button label="GUARDAR RASTREADOR" loading={guardando} onPress={() => void guardarDispositivo()} />
        </View>
      )}

      <Text style={styles.seccion}>Rastreadores registrados</Text>
      {dispositivos.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay rastreadores registrados.</Text>
      ) : (
        dispositivos.map((d) => (
          <View key={d.imei} style={styles.card}>
            <Text style={styles.nombre}>{d.unidadNombre}</Text>
            <Text style={styles.detalle}>
              {d.nombre} · IMEI {d.imei}
            </Text>
            <Text style={styles.detalle}>{haceCuanto(d.ultimoContactoMs)}</Text>
            {d.activo ? <Button label="DESACTIVAR" variant="danger" onPress={() => void desactivar(d)} /> : null}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, marginBottom: 8 },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario },
  nombre: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  detalle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
});
