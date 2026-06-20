export type RolUsuario = 'admin' | 'operador';

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
}
