import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { showAlert } from '@/utils/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';
import { loginApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [usuario, setUsuarioInput] = useState('');
  const [pin, setPin] = useState('');
  const setUsuarioGlobal = useAppStore((s) => s.setUsuario);

  const ingresar = async () => {
    const u = usuario.trim().toLowerCase();
    const p = pin.trim();
    if (!u || p.length !== 4) {
      showAlert('Datos incompletos', 'Ingresá usuario y PIN de 4 dígitos.');
      return;
    }
    try {
      const remoto = await loginApi(u, p);
      if (!remoto) {
        showAlert('Login', 'No se pudo autenticar contra el backend. Verificá la API.');
        return;
      }
      setUsuarioGlobal(remoto);
      router.replace('/(admin)');
    } catch (e) {
      showAlert('Login', e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientTop} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.center, Platform.OS !== 'web' ? { paddingTop: insets.top + 8 } : null]}
      >
        <Image
          source={require('@/assets/images/logo-don-ramon.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>Control de Stock</Text>
        <View style={[styles.card, Platform.OS === 'web' ? styles.cardWeb : undefined]}>
          <TextInput
            placeholder="Usuario"
            placeholderTextColor={COLORS.grisSecundario}
            style={[styles.input, styles.inputSpacing]}
            value={usuario}
            onChangeText={setUsuarioInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="PIN (4 dígitos)"
            placeholderTextColor={COLORS.grisSecundario}
            style={[styles.input, styles.inputSpacing]}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />
          <Button label="INGRESAR" onPress={() => void ingresar()} />
        </View>
        <Text style={styles.footer}>Don Ramón · San Rafael · v1.0.0</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.negroProfundo },
  gradientTop: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.dorado, opacity: 0.05 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 150, height: 150, borderRadius: 16, marginBottom: 4 },
  titulo: { color: COLORS.doradoClaro, fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginTop: 6, marginBottom: 26 },
  card: { width: '100%', backgroundColor: COLORS.crema, borderRadius: 24, padding: 16 },
  cardWeb: { maxWidth: 420 },
  input: {
    borderWidth: 1,
    borderColor: '#dcd2c8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: '#fff',
    color: COLORS.grisTexto,
  },
  inputSpacing: { marginBottom: 12 },
  footer: { color: COLORS.doradoClaro, fontFamily: 'Poppins_400Regular', marginTop: 18 },
});
