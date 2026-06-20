import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarResesApi } from '@/services/stockApi';
import type { Res } from '@/types';

export default function StockIndex() {
  const [reses, setReses] = useState<Res[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      listarResesApi('en_stock')
        .then((data) => activo && setReses(data))
        .catch(() => activo && setReses([]))
        .finally(() => activo && setCargando(false));
      return () => {
        activo = false;
      };
    }, [])
  );

  return (
    <Screen title="Stock de reses" subtitle="Reses en stock" scrollable>
      <Button label="ESCANEAR CARAVANA" onPress={() => router.push('/(admin)/stock/escanear')} />
      <Button
        label="ALTA MANUAL DE RES"
        variant="secondary"
        onPress={() => router.push('/(admin)/stock/nueva-res')}
      />

      {cargando ? (
        <ActivityIndicator color={COLORS.negro} style={{ marginTop: 20 }} />
      ) : reses.length === 0 ? (
        <Text style={styles.vacio}>No hay reses en stock.</Text>
      ) : (
        reses.map((res) => (
          <View key={res.id} style={styles.card}>
            <Text style={styles.gar}>{res.gar}</Text>
            <Text style={styles.detalle}>
              Caravana {res.codigoCaravana} · {res.clasificacion ?? '–'} {res.tipificacion ?? ''}
            </Text>
            <Text style={styles.kilos}>
              {res.kilosDisponibles} kg disponibles de {res.kilosIngreso} kg
            </Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario, marginTop: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4 },
  gar: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.grisTexto },
  detalle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  kilos: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.doradoOscuro },
});
