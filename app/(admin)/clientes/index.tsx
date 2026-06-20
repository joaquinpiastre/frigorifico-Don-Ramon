import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { crearClienteApi, listarClientesApi } from '@/services/clientesApi';
import { CONDICION_IVA_LABEL, type Cliente, type CondicionIva } from '@/types';

const CONDICIONES: CondicionIva[] = ['responsable_inscripto', 'monotributo', 'exento', 'consumidor_final'];

export default function ClientesIndex() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [creando, setCreando] = useState(false);
  const [numeroCliente, setNumeroCliente] = useState('');
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [condicionIva, setCondicionIva] = useState<CondicionIva | null>(null);
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listarClientesApi().then(setClientes).catch(() => setClientes([]));
    }, [])
  );

  const guardarCliente = async () => {
    if (!numeroCliente.trim() || !nombre.trim()) {
      Alert.alert('Cliente', 'Ingresá número y nombre del cliente.');
      return;
    }
    setGuardando(true);
    try {
      await crearClienteApi({
        numeroCliente: numeroCliente.trim(),
        nombre: nombre.trim(),
        razonSocial: razonSocial.trim() || undefined,
        cuit: cuit.trim() || undefined,
        condicionIva: condicionIva ?? undefined,
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
      });
      setNumeroCliente('');
      setNombre('');
      setRazonSocial('');
      setCuit('');
      setCondicionIva(null);
      setTelefono('');
      setDireccion('');
      setCreando(false);
      listarClientesApi().then(setClientes).catch(() => undefined);
    } catch (e) {
      Alert.alert('Cliente', e instanceof Error ? e.message : 'No se pudo crear el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Screen title="Clientes" subtitle="Cuenta corriente" scrollable>
      {!creando ? (
        <Button label="NUEVO CLIENTE" onPress={() => setCreando(true)} />
      ) : (
        <View style={styles.card}>
          <Input label="Número de cliente" value={numeroCliente} onChangeText={setNumeroCliente} />
          <Input label="Nombre (fantasía / contacto)" value={nombre} onChangeText={setNombre} />
          <Input label="Razón social" value={razonSocial} onChangeText={setRazonSocial} />
          <Input label="CUIT" value={cuit} onChangeText={setCuit} keyboardType="number-pad" />
          <Text style={styles.label}>Condición frente al IVA</Text>
          <View style={styles.fila}>
            {CONDICIONES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, condicionIva === c && styles.chipActivo]}
                onPress={() => setCondicionIva(c)}
              >
                <Text style={[styles.chipTexto, condicionIva === c && styles.chipTextoActivo]}>
                  {CONDICION_IVA_LABEL[c]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input label="Teléfono" value={telefono} onChangeText={setTelefono} />
          <Input label="Dirección" value={direccion} onChangeText={setDireccion} />
          <Button label="GUARDAR CLIENTE" loading={guardando} onPress={() => void guardarCliente()} />
        </View>
      )}

      <ScrollView style={{ marginTop: 12 }}>
        {clientes.map((c) => (
          <Pressable
            key={c.id}
            style={styles.card}
            onPress={() => router.push(`/(admin)/clientes/${c.id}`)}
          >
            <Text style={styles.nombre}>
              #{c.numeroCliente} · {c.nombre}
            </Text>
            {c.razonSocial ? <Text style={styles.razonSocial}>{c.razonSocial}</Text> : null}
            <Text style={[styles.saldo, (c.saldo ?? 0) > 0 && styles.saldoDeudor]}>
              Saldo: ${(c.saldo ?? 0).toFixed(2)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 4, marginBottom: 8 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto, marginBottom: 6 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcd2c8',
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.grisTexto },
  chipTextoActivo: { color: '#fff' },
  nombre: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  razonSocial: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  saldo: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.exito },
  saldoDeudor: { color: COLORS.error },
});
