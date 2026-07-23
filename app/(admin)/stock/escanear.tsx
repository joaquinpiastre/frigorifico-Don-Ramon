import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarcodeScannerModal } from '@/components/scanner/BarcodeScannerModal';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/colors';
import { buscarResPorCodigoApi } from '@/services/stockApi';

export default function EscanearEtiqueta() {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const procesarCodigo = async (valorManual?: string) => {
    const valor = (valorManual ?? codigo).trim();
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

  const onCodigoEscaneado = (valor: string) => {
    setMostrarCamara(false);
    void procesarCodigo(valor);
  };

  return (
    <Screen title="Leer etiqueta" subtitle="Pistola lectora o cámara del teléfono">
      <View style={styles.filaCodigo}>
        <View style={{ flex: 1 }}>
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
        </View>
        <Pressable
          style={styles.camaraBtn}
          onPress={() => setMostrarCamara(true)}
          hitSlop={8}
        >
          <Ionicons name="camera" size={22} color="#fff" />
        </Pressable>
      </View>

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

      <BarcodeScannerModal
        visible={mostrarCamara}
        onClose={() => setMostrarCamara(false)}
        onScanned={onCodigoEscaneado}
        titulo="Escanear Cor de la res"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filaCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  camaraBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.negro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mensaje: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.grisTexto,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    textAlign: 'center',
  },
});
