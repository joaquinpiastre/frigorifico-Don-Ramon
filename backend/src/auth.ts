import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface AuthClaims {
  sub: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'repartidor';
}

export function signToken(claims: AuthClaims): string {
  return jwt.sign(claims, config.jwtSecret, { expiresIn: '24h' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta token Bearer.' });
    return;
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthClaims;
    (req as Request & { user?: AuthClaims }).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: AuthClaims }).user;
  if (user?.rol !== 'admin') {
    res.status(403).json({ error: 'Acción reservada para administradores.' });
    return;
  }
  next();
}

export function requireRol(...roles: AuthClaims['rol'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: AuthClaims }).user;
    if (!user || !roles.includes(user.rol)) {
      res.status(403).json({ error: 'No tenés permiso para esta acción.' });
      return;
    }
    next();
  };
}
