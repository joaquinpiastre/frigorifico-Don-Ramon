import { Alert, Platform } from "react-native";

/**
 * RN Web's Alert.alert() is a no-op (react-native-web ships an empty stub),
 * so on web every confirmation/error message silently did nothing.
 * This wraps it so the same call works on native and web.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Misma idea que showAlert: en web usamos window.confirm porque Alert.alert
 * no soporta botones/callbacks en react-native-web.
 */
export function showConfirm(title: string, message?: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(
      window.confirm(message ? `${title}\n\n${message}` : title),
    );
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
