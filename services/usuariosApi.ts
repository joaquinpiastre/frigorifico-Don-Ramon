import type { RolUsuario, UsuarioAdmin } from '@/types';
import { apiRequest } from './apiClient';

export async function listarUsuariosApi(): Promise<UsuarioAdmin[]> {
  const data = await apiRequest<{ usuarios: UsuarioAdmin[] }>('/admin/usuarios');
  return data.usuarios;
}

export async function crearUsuarioApi(input: {
  id: string;
  nombre: string;
  pin: string;
  rol: RolUsuario;
}): Promise<UsuarioAdmin> {
  const data = await apiRequest<{ usuario: UsuarioAdmin }>('/admin/usuarios', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.usuario;
}

export async function actualizarUsuarioApi(
  id: string,
  input: { nombre?: string; pin?: string; rol?: RolUsuario; activo?: boolean }
): Promise<UsuarioAdmin> {
  const data = await apiRequest<{ usuario: UsuarioAdmin }>(`/admin/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.usuario;
}
