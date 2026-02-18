// src/routes/public.routes.ts

/**
 * RUTAS PÚBLICAS (sin autenticación)
 * 
 * Router agrupador para todas las rutas que NO requieren autenticación JWT.
 * Se monta en /api/public en server.ts.
 */

// #section Imports
import { Router } from 'express';
import { authRouter } from './auth.routes';
// #end-section

// #section Create publicRouter
export const publicRouter = Router();
// #end-section

// #section Sub-routes
publicRouter.use('/auth', authRouter);
// #end-section
