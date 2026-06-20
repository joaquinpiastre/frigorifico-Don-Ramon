import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { cerrarCargaApi, crearCargaApi, escanearItemCargaApi } from '@/services/cargasApi';
import type { CargaItem } from '@/types';

export default function NuevaCargaReparto() {
  const [cargaId, setCargaId] = useState<number | null>(null);
  const [items, setItems] = useState<CargaItem[]>([]);
  const [codigo, setCodigo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    crearCargaApi()
      .then((carga) => setCargaId(carga.id))
      .catch(() => Alert.alert('Carga', 'No se pudo abrir la carga de reparto.'));
  }, []);

  const procesarCodigo = async () => {
    const cor = codigo.trim();
    if (!cor || !cargaId || procesando) return;
    setProcesando(true);
    try {
      const item = await escanearItemCargaApi(cargaId, cor);
      setItems((prev) => [item, ...prev]);
      setMensaje(`✓ Garrón ${item.garron ?? '–'} · ${item.kilosDisponibles} kg`);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo agregar esa res.');
    } finally {
      setCodigo('');
      setProcesando(false);
      inputRef.current?.focus();
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

  return (
    <Screen title="Carga de reparto" subtitle="Apuntá la pistola y disparale a cada etiqueta" scrollable>
      <Input
        ref={inputRef}
        label="Código (Cor)"
        value={codigo}
        onChangeText={setCodigo}
        onSubmitEditing={() => void procesarCodigo()}
        autoFocus
        blurOnSubmit={false}
        returnKeyType="done"
        placeholder="Esperando lectura…"
      />
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
  mensaje: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.grisTexto,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
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
