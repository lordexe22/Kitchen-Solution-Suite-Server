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
import { loginService } from "../services/auth/login/login.service";
import { registerService } from "../services/auth/register/register.service";
import { autoLoginService } from "../services/auth/autoLogin/autoLogin.service";
import { logoutService } from "../services/auth/logout/logout.service";
import { clearJWTCookie } from "../lib/modules/jwtCookieManager";
// #end-section
// #middleware registerMiddleware
export const registerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // #step 1 - Call register service
    const { user, cookieData } = await registerService(req.body);
    // #end-step
    // #step 2 - Set JWT cookie in response
    res.cookie(cookieData.name, cookieData.value, cookieData.options);
    // #end-step
    // #step 3 - Send response
    res.json({ success: true, user });
    // #end-step
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
    // #step 1 - Call login service
    const { user, cookieData } = await loginService(req.body);
    // #end-step
    // #step 2 - Set JWT cookie in response
    res.cookie(cookieData.name, cookieData.value, cookieData.options);
    // #end-step
    // #step 3 - Send response
    res.json({ success: true, user });
    // #end-step
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
    // #step 1 - Call auto-login service
    const { user, statusCode, cookieData } = await autoLoginService(req as any);
    // #end-step

    // #step 2 - Handle cookie based on status
    if (statusCode !== 'SUCCESS') {
      // If failed, clear cookie
      const clearData = clearJWTCookie();
      res.cookie(clearData.name, clearData.value, clearData.options);
    } else if (cookieData) {
      // If successful, set refreshed cookie with updated user data
      res.cookie(cookieData.name, cookieData.value, cookieData.options);
    }
    // #end-step

    // #step 3 - Send response based on result
    if (user) {
      res.status(200).json({ success: true, user });
      return;
    }

    // No token or token expired/invalid: return null user with 200 status
    res.status(200).json({ success: true, user: null });
    // #end-step
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-login failed';
    res.status(401).json({ error: message });
  }
};
// #end-middleware

// #middleware logoutMiddleware
export const logoutMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // #step 1 - Call logout service
    const { cookieClearData } = logoutService();
    // #end-step

    // #step 2 - Clear JWT cookie
    res.cookie(cookieClearData.name, cookieClearData.value, cookieClearData.options);
    // #end-step

    // #step 3 - Send response
    res.json({ success: true, message: 'Logged out successfully' });
    // #end-step
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    res.status(500).json({ success: false, error: message });
  }
};
// #end-middleware
