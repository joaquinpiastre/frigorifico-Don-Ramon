import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { crearClienteApi, listarClientesApi } from '@/services/clientesApi';
import { CONDICION_IVA_LABEL, type Cliente, type CondicionIva } from '@/types';
import { coincideBusqueda } from '@/utils/busqueda';

const CONDICIONES: CondicionIva[] = ['responsable_inscripto', 'monotributo', 'exento', 'consumidor_final'];

export default function ClientesOperador() {
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
  const [busqueda, setBusqueda] = useState('');

  useFocusEffect(
    useCallback(() => {
      listarClientesApi().then(setClientes).catch(() => setClientes([]));
    }, [])
  );

  const guardarCliente = async () => {
    if (!numeroCliente.trim() || !nombre.trim()) {
      showAlert('Cliente', 'Ingresá número y nombre del cliente.');
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
      showAlert('Cliente', e instanceof Error ? e.message : 'No se pudo crear el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    coincideBusqueda(busqueda, c.numeroCliente, c.nombre, c.razonSocial, c.cuit, c.telefono, c.direccion)
  );

  return (
    <Screen title="Clientes" subtitle="A visitar en el reparto" scrollable>
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
          <Button label="CANCELAR" variant="secondary" onPress={() => setCreando(false)} />
        </View>
      )}

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
            <Pressable key={c.id} style={styles.card} onPress={() => router.push(`/(operador)/clientes/${c.id}`)}>
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
  saldo: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.exito },
  saldoDeudor: { color: COLORS.error },
});
