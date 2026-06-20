import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';

export default function AdminHome() {
  const { usuario, resetSesion } = useAppStore();

  return (
    <Screen title={`Hola, ${usuario?.nombre ?? ''}`} subtitle="Don Ramón · Control de Stock" scrollable>
      <Text style={styles.placeholder}>
        Base del proyecto lista. Las pantallas de stock, rastreadores y reportes se agregan a partir de aquí
        según las indicaciones que vayas dando.
      </Text>
      <Button
        label="CERRAR SESIÓN"
        variant="danger"
        onPress={() => {
          resetSesion();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    fontFamily: 'Poppins_400Regular',
    color: COLORS.grisTexto,
    lineHeight: 21,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
  },
});
