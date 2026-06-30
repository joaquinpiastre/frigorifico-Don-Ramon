import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { METODO_PAGO_LABEL, type MetodoPago } from "@/types";
import { Input } from "./Input";

const METODOS: MetodoPago[] = ["efectivo", "transferencia", "cheque"];

interface Props {
  metodo: MetodoPago | null;
  onMetodoChange: (metodo: MetodoPago) => void;
  diasCheque: string;
  onDiasChequeChange: (dias: string) => void;
  numeroCheque: string;
  onNumeroChequeChange: (numero: string) => void;
  banco: string;
  onBancoChange: (banco: string) => void;
}

export function MetodoPagoSelector({
  metodo,
  onMetodoChange,
  diasCheque,
  onDiasChequeChange,
  numeroCheque,
  onNumeroChequeChange,
  banco,
  onBancoChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Forma de pago</Text>
      <View style={styles.chips}>
        {METODOS.map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, metodo === m && styles.chipActivo]}
            onPress={() => onMetodoChange(m)}
          >
            <Text
              style={[styles.chipTexto, metodo === m && styles.chipTextoActivo]}
            >
              {METODO_PAGO_LABEL[m]}
            </Text>
          </Pressable>
        ))}
      </View>
      {metodo === "cheque" ? (
        <>
          <Input
            label="Número de cheque"
            value={numeroCheque}
            onChangeText={onNumeroChequeChange}
            placeholder="Ej: 00012345"
          />
          <Input
            label="Banco"
            value={banco}
            onChangeText={onBancoChange}
            placeholder="Ej: Banco Nación"
          />
          <Input
            label="¿A cuántos días es el cheque?"
            value={diasCheque}
            onChangeText={onDiasChequeChange}
            keyboardType="number-pad"
            placeholder="Ej: 30"
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisSecundario,
  },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.grisClaro,
    borderWidth: 1,
    borderColor: COLORS.grisClaro,
  },
  chipActivo: {
    backgroundColor: COLORS.dorado,
    borderColor: COLORS.doradoOscuro,
  },
  chipTexto: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.grisTexto,
  },
  chipTextoActivo: { color: COLORS.negro },
});
