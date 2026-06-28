import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarResesApi } from '@/services/stockApi';
import type { Res } from '@/types';

const DEBOUNCE_MS = 350;

export default function StockIndex() {
  const [reses, setReses] = useState<Res[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setBusquedaActiva(busqueda.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      listarResesApi({ estado: 'en_stock', q: busquedaActiva || undefined, limit: 200 })
        .then((data) => activo && setReses(data))
        .catch(() => activo && setReses([]))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, [busquedaActiva])
  );

  const kilosTotales = reses.reduce((acc, r) => acc + r.kilosDisponibles, 0);

  return (
    <Screen title="Stock" subtitle="Stock disponible" scrollable>
      <Button label="ESCANEAR ETIQUETA" onPress={() => router.push('/(admin)/stock/escanear')} />
      <Button
        label="ALTA MANUAL"
        variant="secondary"
        onPress={() => router.push('/(admin)/stock/nueva-res')}
      />

      <Input
        placeholder="Buscar por Cor, garrón o clasificación…"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>{reses.length} ítems</Text>
        <Text style={styles.resumenTexto}>{kilosTotales.toFixed(0)} kg disponibles</Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : reses.length === 0 ? (
        <Text style={styles.vacio}>
          {busquedaActiva ? `Sin resultados para "${busquedaActiva}".` : 'No hay stock disponible.'}
        </Text>
      ) : (
        reses.map((res) => (
          <Pressable
            key={res.id}
            style={styles.card}
            onPress={() => router.push(`/(admin)/stock/${res.id}`)}
          >
            <Text style={styles.gar}>Garrón {res.garron ?? '–'}</Text>
            <Text style={styles.detalle}>
              Cor {res.cor} · {res.clasificacion ?? '–'}
            </Text>
            <Text style={styles.kilos}>
              {res.kilosDisponibles} kg disponibles de {res.kilosIngreso} kg
            </Text>
          </Pressable>
        ))
      )}
      {reses.length === 200 ? (
        <Text style={styles.aviso}>Mostrando los primeros 200 resultados. Afiná la búsqueda para ver más.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario, marginTop: 20, textAlign: 'center' },
  aviso: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.grisSecundario,
    textAlign: 'center',
    marginTop: 8,
  },
  resumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  resumenTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.doradoOscuro },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  gar: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.grisTexto },
  detalle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  kilos: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.doradoOscuro },
});
