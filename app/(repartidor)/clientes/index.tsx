import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { listarClientesApi } from '@/services/clientesApi';
import type { Cliente } from '@/types';
import { coincideBusqueda } from '@/utils/busqueda';

export default function ClientesRepartidor() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      listarClientesApi().then(setClientes).catch(() => setClientes([]));
    }, [])
  );

  const clientesFiltrados = clientes.filter((c) =>
    coincideBusqueda(busqueda, c.numeroCliente, c.nombre, c.razonSocial, c.cuit, c.telefono, c.direccion)
  );

  return (
    <Screen title="Clientes" subtitle="A visitar en el reparto" scrollable>
      <Input
        placeholder="Buscar por nombre, número, teléfono o dirección…"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.contador}>
        {clientesFiltrados.length} de {clientes.length} clientes
      </Text>
      <ScrollView style={{ marginTop: 4 }}>
        {clientesFiltrados.length === 0 ? (
          <Text style={styles.vacio}>
            {busqueda.trim() ? `Sin resultados para "${busqueda.trim()}".` : 'No hay clientes registrados.'}
          </Text>
        ) : (
          clientesFiltrados.map((c) => (
            <Pressable key={c.id} style={styles.card} onPress={() => router.push(`/(repartidor)/clientes/${c.id}`)}>
              <Text style={styles.nombre}>
                #{c.numeroCliente} · {c.nombre}
              </Text>
              <Text style={[styles.saldo, (c.saldo ?? 0) > 0 && styles.saldoDeudor]}>
                Saldo: ${(c.saldo ?? 0).toFixed(2)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contador: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario, marginBottom: 8 },
  vacio: { fontFamily: 'Poppins_400Regular', color: COLORS.grisSecundario, marginTop: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4, marginBottom: 8 },
  nombre: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  saldo: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.exito },
  saldoDeudor: { color: COLORS.error },
});
