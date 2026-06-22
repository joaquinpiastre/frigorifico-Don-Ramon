import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { crearLoteApi, crearResApi, listarLotesApi } from '@/services/stockApi';
import type { LoteIngreso } from '@/types';

export default function NuevaRes() {
  const params = useLocalSearchParams<{ codigo?: string }>();

  const [lotes, setLotes] = useState<LoteIngreso[]>([]);
  const [loteId, setLoteId] = useState<number | null>(null);
  const [creandoLote, setCreandoLote] = useState(false);

  const [numeroTropa, setNumeroTropa] = useState('');
  const [dte, setDte] = useState('');
  const [fechaFaena, setFechaFaena] = useState('');
  const [establecimiento, setEstablecimiento] = useState('');

  const [cor, setCor] = useState(params.codigo ?? '');
  const [garron, setGarron] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [kilos, setKilos] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarLotesApi()
      .then((data) => {
        setLotes(data);
        if (data.length > 0) setLoteId(data[0].id);
      })
      .catch(() => setLotes([]));
  }, []);

  const guardarTropaYContinuar = async () => {
    if (!numeroTropa.trim()) {
      showAlert('Tropa', 'Ingresá el número de tropa.');
      return;
    }
    try {
      const lote = await crearLoteApi({
        numeroTropa: numeroTropa.trim(),
        dte: dte.trim() || undefined,
        fechaFaena: fechaFaena.trim() || undefined,
        establecimiento: establecimiento.trim() || undefined,
      });
      setLotes((prev) => [lote, ...prev]);
      setLoteId(lote.id);
      setCreandoLote(false);
    } catch (e) {
      showAlert('Tropa', e instanceof Error ? e.message : 'No se pudo crear la tropa.');
    }
  };

  const guardarRes = async () => {
    const kilosNum = Number(kilos.replace(',', '.'));
    if (!loteId) {
      showAlert('Res', 'Seleccioná o creá una tropa primero.');
      return;
    }
    if (!cor.trim() || !kilosNum || kilosNum <= 0) {
      showAlert('Res', 'Completá el código (Cor) de la etiqueta y los kilos.');
      return;
    }
    setGuardando(true);
    try {
      await crearResApi({
        loteId,
        cor: cor.trim(),
        garron: garron.trim() || undefined,
        clasificacion: clasificacion.trim() || undefined,
        kilos: kilosNum,
      });
      showAlert('Res registrada', `Cor ${cor.trim()} se agregó al stock.`);
      router.replace('/(admin)/stock');
    } catch (e) {
      showAlert('Res', e instanceof Error ? e.message : 'No se pudo registrar la res.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen title="Alta de res" subtitle="Datos de la etiqueta" scrollable>
      <Text style={styles.seccion}>Tropa</Text>
      {!creandoLote ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {lotes.map((lote) => (
              <Pressable
                key={lote.id}
                style={[styles.chip, loteId === lote.id && styles.chipActivo]}
                onPress={() => setLoteId(lote.id)}
              >
                <Text style={[styles.chipTexto, loteId === lote.id && styles.chipTextoActivo]}>
                  Tropa {lote.numeroTropa}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button label="NUEVA TROPA" variant="secondary" onPress={() => setCreandoLote(true)} />
        </>
      ) : (
        <View style={styles.card}>
          <Input label="Número de tropa" value={numeroTropa} onChangeText={setNumeroTropa} />
          <Input label="DTe" value={dte} onChangeText={setDte} />
          <Input label="Fecha de faena (AAAA-MM-DD)" value={fechaFaena} onChangeText={setFechaFaena} />
          <Input label="Establecimiento" value={establecimiento} onChangeText={setEstablecimiento} />
          <Button label="GUARDAR TROPA" onPress={() => void guardarTropaYContinuar()} />
        </View>
      )}

      <Text style={styles.seccion}>Res</Text>
      <View style={styles.card}>
        <Input label="Cor (código de barras de la etiqueta)" value={cor} onChangeText={setCor} />
        <Input label="Garrón (ej. 030)" value={garron} onChangeText={setGarron} />
        <Input
          label="Clasificación (ej. Novillito B 1 2D 000 ZZ)"
          value={clasificacion}
          onChangeText={setClasificacion}
          autoCapitalize="characters"
        />
        <Input label="Kilos" value={kilos} onChangeText={setKilos} keyboardType="decimal-pad" />
        <Button label="GUARDAR RES" loading={guardando} onPress={() => void guardarRes()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dcd2c8',
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  chipTextoActivo: { color: '#fff' },
});
