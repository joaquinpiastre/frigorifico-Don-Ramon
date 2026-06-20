import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { buscarResPorCodigoApi } from '@/services/stockApi';

export default function EscanearEtiqueta() {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const procesarCodigo = async () => {
    const valor = codigo.trim();
    if (!valor || buscando) return;
    setBuscando(true);
    setMensaje(`Buscando ${valor}…`);
    try {
      const res = await buscarResPorCodigoApi(valor);
      if (res) {
        setMensaje(`Garrón ${res.garron ?? '–'} · ${res.kilosDisponibles} kg disponibles`);
      } else {
        setMensaje(`Código ${valor} no registrado. Abriendo alta de res…`);
        router.push({ pathname: '/(admin)/stock/nueva-res', params: { codigo: valor } });
      }
    } finally {
      setCodigo('');
      setBuscando(false);
      inputRef.current?.focus();
    }
  };

  return (
    <Screen title="Leer etiqueta" subtitle="Apuntá la pistola lectora y dispará">
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
});
