// src/middlewares/auth.middlewares.ts

/**
 * MIDDLEWARES MAESTROS DE AUTENTICACIÓN
 * 
 * Estos middlewares orquestan los servicios de autenticación (login/register)
 * y manejan las operaciones HTTP (cookies, responses).
 * 
 * La lógica de negocio reside en los servicios (services/auth/).
 */

// #section Imports
import { Request, Response, NextFunction } from "express";
import { loginService } from "../services/auth/login.service";
import { registerService } from "../services/auth/register.service";
import { setJWTCookie, decodeJWT, getJWTFromCookie } from "../lib/modules/jwtCookieManager";
import { db } from "../db/init";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
// #end-section

// #middleware registerMiddleware
export const registerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await registerService(req.body);
    const cookieData = setJWTCookie(token);
    res.cookie(cookieData.name, cookieData.value, cookieData.options);
    res.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware loginMiddleware
export const loginMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, token } = await loginService(req.body);
    const cookieData = setJWTCookie(token);
    res.cookie(cookieData.name, cookieData.value, cookieData.options);
    res.json({ success: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
};
// #end-middleware

// #middleware autoLoginMiddleware
export const autoLoginMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = getJWTFromCookie(req as any);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const payload = decodeJWT(token);
    
    if (!payload || !payload.userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, Number(payload.userId)))
      .limit(1);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      state: user.state,
    };
    
    res.json({ success: true, user: userData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-login failed';
    res.status(401).json({ error: message });
  }
};
// #end-middleware
