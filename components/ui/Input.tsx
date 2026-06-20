import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { COLORS } from '@/constants/colors';

interface Props extends TextInputProps {
  label?: string;
}

export const Input = forwardRef<TextInput, Props>(({ label, style, ...rest }, ref) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput ref={ref} placeholderTextColor={COLORS.grisSecundario} style={[styles.input, style]} {...rest} />
    </View>
  );
});
Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.grisTexto,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcd2c8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: '#fff',
    color: COLORS.grisTexto,
  },
});
