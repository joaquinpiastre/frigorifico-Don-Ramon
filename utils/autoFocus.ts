import { Platform } from 'react-native';

// En el teléfono, un autoFocus abre el teclado solo y deja la pantalla sin poder scrollear.
// Se mantiene únicamente en la computadora (donde se usa la pistola lectora de códigos).
export const AUTO_FOCUS_ESCRITORIO: boolean =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
