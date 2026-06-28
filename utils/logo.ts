import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

let cache: string | null = null;

export async function obtenerLogoBase64(): Promise<string> {
  if (cache) return cache;

  const asset = Asset.fromModule(require('@/assets/images/logo-don-ramon.jpg'));
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;

  if (Platform.OS === 'web') {
    const respuesta = await fetch(uri);
    const blob = await respuesta.blob();
    cache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return cache;
  }

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  cache = `data:image/jpeg;base64,${base64}`;
  return cache;
}
