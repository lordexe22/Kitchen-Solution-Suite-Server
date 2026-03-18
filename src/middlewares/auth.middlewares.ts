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
// #middleware registerMiddleware - Registra un nuevo usuario y establece la cookie JWT
/**
 * @description Middleware que procesa el registro de un nuevo usuario en el sistema.
 * @purpose Orquestar el servicio de registro y manejar la respuesta HTTP con la cookie JWT.
 * @context Utilizado en la ruta POST /api/auth/register como handler principal.
 * @param req petición con los datos del nuevo usuario en el body
 * @param res respuesta HTTP donde se establece la cookie y se devuelve el usuario creado
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
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
    res.json({ data: user });
    // #end-step
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
};
// #end-middleware
// #middleware loginMiddleware - Autentica un usuario existente y establece la cookie JWT
/**
 * @description Middleware que procesa el inicio de sesión de un usuario existente.
 * @purpose Orquestar el servicio de login y manejar la respuesta HTTP con la cookie JWT.
 * @context Utilizado en la ruta POST /api/auth/login como handler principal.
 * @param req petición con las credenciales del usuario en el body
 * @param res respuesta HTTP donde se establece la cookie y se devuelve el usuario autenticado
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
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
    res.json({ data: user });
    // #end-step
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ error: message });
  }
};
// #end-middleware
// #middleware autoLoginMiddleware - Intenta autenticar al usuario usando el JWT almacenado en cookie
/**
 * @description Middleware que intenta reautenticar al usuario a partir del JWT en la cookie.
 * @purpose Orquestar el servicio de auto-login y renovar o limpiar la cookie según el resultado.
 * @context Utilizado en la ruta GET /api/auth/auto-login para restaurar sesiones existentes.
 * @param req petición con la cookie JWT del usuario
 * @param res respuesta HTTP con el usuario autenticado o null si el token no es válido
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
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
      res.status(200).json({ data: user });
      return;
    }

    // No token or token expired/invalid: return null user with 200 status
    res.status(200).json({ data: null });
    // #end-step
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-login failed';
    res.status(401).json({ error: message });
  }
};
// #end-middleware
// #middleware logoutMiddleware - Cierra la sesión del usuario eliminando la cookie JWT
/**
 * @description Middleware que gestiona el cierre de sesión limpiando la cookie JWT.
 * @purpose Orquestar el servicio de logout y eliminar la cookie de autenticación de la respuesta.
 * @context Utilizado en la ruta POST /api/auth/logout como handler principal.
 * @param req petición del usuario que desea cerrar sesión
 * @param res respuesta HTTP donde se elimina la cookie JWT
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
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
    res.json({ data: { message: 'Logged out successfully' } });
    // #end-step
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    res.status(500).json({ error: message });
  }
};
// #end-middleware
