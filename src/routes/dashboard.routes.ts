// src/routes/dashboard.routes.ts

/**
 * RUTAS DEL DASHBOARD (protegidas)
 * 
 * Router agrupador para todas las rutas que requieren autenticación JWT.
 * Se monta en /api/dashboard con validateJWTMiddleware en server.ts.
 */

// #section Imports
import { Router } from 'express';
import { companyRouter } from './company.routes';
import devToolsRouter from './devTools.routes';
// #end-section

// #section Create dashboardRouter
export const dashboardRouter = Router();
// #end-section

// #section Sub-routes
dashboardRouter.use('/company', companyRouter);
dashboardRouter.use('/devtools', devToolsRouter);
// #end-section
