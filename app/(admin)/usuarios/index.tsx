import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { actualizarUsuarioApi, crearUsuarioApi, listarUsuariosApi } from '@/services/usuariosApi';
import { useAppStore } from '@/store/useAppStore';
import type { RolUsuario, UsuarioAdmin } from '@/types';

const ROLES: RolUsuario[] = ['admin', 'operador'];

export default function UsuariosIndex() {
  const usuarioActual = useAppStore((s) => s.usuario);

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [creando, setCreando] = useState(false);
  const [id, setId] = useState('');
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [rol, setRol] = useState<RolUsuario>('operador');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuarioActual && usuarioActual.rol !== 'admin') {
      router.replace('/(admin)');
    }
  }, [usuarioActual]);

  useFocusEffect(
    useCallback(() => {
      listarUsuariosApi().then(setUsuarios).catch(() => setUsuarios([]));
    }, [])
  );

  if (usuarioActual && usuarioActual.rol !== 'admin') {
    return null;
  }

  const guardarUsuario = async () => {
    if (!id.trim() || !nombre.trim() || pin.trim().length !== 4) {
      Alert.alert('Usuario', 'Completá usuario, nombre y un PIN de 4 dígitos.');
      return;
    }
    setGuardando(true);
    try {
      await crearUsuarioApi({ id: id.trim(), nombre: nombre.trim(), pin: pin.trim(), rol });
      setId('');
      setNombre('');
      setPin('');
      setRol('operador');
      setCreando(false);
      listarUsuariosApi().then(setUsuarios).catch(() => undefined);
    } catch (e) {
      Alert.alert('Usuario', e instanceof Error ? e.message : 'No se pudo crear el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (u: UsuarioAdmin) => {
    try {
      await actualizarUsuarioApi(u.id, { activo: !u.activo });
      listarUsuariosApi().then(setUsuarios).catch(() => undefined);
    } catch (e) {
      Alert.alert('Usuario', e instanceof Error ? e.message : 'No se pudo actualizar el usuario.');
    }
  };

  return (
    <Screen title="Usuarios" subtitle="Acceso al sistema" scrollable>
      {!creando ? (
        <Button label="NUEVO USUARIO" onPress={() => setCreando(true)} />
      ) : (
        <View style={styles.card}>
          <Input label="Usuario" value={id} onChangeText={setId} autoCapitalize="none" autoCorrect={false} />
          <Input label="Nombre" value={nombre} onChangeText={setNombre} />
          <Input label="PIN (4 dígitos)" value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={4} secureTextEntry />
          <Text style={styles.label}>Rol</Text>
          <View style={styles.fila}>
            {ROLES.map((r) => (
              <View key={r} style={[styles.chip, rol === r && styles.chipActivo]} onTouchEnd={() => setRol(r)}>
                <Text style={[styles.chipTexto, rol === r && styles.chipTextoActivo]}>
                  {r === 'admin' ? 'Admin' : 'Operador'}
                </Text>
              </View>
            ))}
          </View>
          <Button label="GUARDAR USUARIO" loading={guardando} onPress={() => void guardarUsuario()} />
        </View>
      )}

      <Text style={styles.seccion}>Usuarios del sistema</Text>
      {usuarios.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.nombre}>
            {u.nombre} <Text style={styles.rolTexto}>· {u.rol === 'admin' ? 'Admin' : 'Operador'}</Text>
          </Text>
          <Text style={styles.idTexto}>usuario: {u.id}</Text>
          <Button
            label={u.activo ? 'DESACTIVAR' : 'ACTIVAR'}
            variant={u.activo ? 'danger' : 'secondary'}
            onPress={() => void toggleActivo(u)}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, marginBottom: 8 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto, marginBottom: 6 },
  fila: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcd2c8',
  },
  chipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  chipTexto: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.grisTexto },
  chipTextoActivo: { color: '#fff' },
  seccion: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto, marginTop: 8 },
  nombre: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.grisTexto },
  rolTexto: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.grisSecundario },
  idTexto: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.grisSecundario },
});
