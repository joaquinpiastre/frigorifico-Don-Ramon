import { create } from 'zustand';
import type { Usuario } from '@/types';

interface AppState {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  resetSesion: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  usuario: null,
  setUsuario: (usuario) => set({ usuario }),
  resetSesion: () => set({ usuario: null }),
}));
