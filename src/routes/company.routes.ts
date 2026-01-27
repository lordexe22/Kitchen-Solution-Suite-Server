// src/routes/company.routes.ts

/**
 * RUTAS DE COMPAÑÍAS
 * 
 * Define todos los endpoints relacionados con la gestión de compañías.
 * Sigue el patrón RESTful estándar.
 * 
 * Estas rutas son montadas en /api/dashboard/company y están protegidas por validateJWTMiddleware.
 * Los middlewares reciben req.user con { id: number, state: string } del JWT.
 */

// #section Imports
import { Router } from 'express';
import {
  createCompanyMiddleware,
  getAllCompaniesMiddleware,
  getCompanyMiddleware,
  updateCompanyMiddleware,
  deleteCompanyMiddleware,
  archiveCompanyMiddleware,
  reactivateCompanyMiddleware,
  checkNameAvailabilityMiddleware,
  checkCompanyPermissionMiddleware,
} from '../middlewares/company.middlewares';
// #end-section

// #section Create companyRouter
export const companyRouter = Router();
// #end-section

// #route GET /check-name - Verificar disponibilidad de nombre (público para UX)
// Query: ?name=MyCompany
// Response: { success: boolean, available: boolean }
companyRouter.get('/check-name', checkNameAvailabilityMiddleware);
// #end-route

// #route POST / - Crear nueva compañía
// Body: { name: string, description?: string, logoUrl?: string }
// Response: { success: boolean, company: Company }
companyRouter.post('/', createCompanyMiddleware);
// #end-route

// #route GET / - Obtener todas las compañías del usuario
// Query: ?state=active&page=1&limit=10
// Response: { success: boolean, companies: Company[], total: number, page: number, limit: number, totalPages: number }
companyRouter.get('/', getAllCompaniesMiddleware);
// #end-route

// #route GET /:id - Obtener una compañía específica
// Params: id (number)
// Response: { success: boolean, company: Company }
companyRouter.get('/:id', getCompanyMiddleware);
// #end-route

// #route PATCH /:id - Actualizar compañía
// Params: id (number)
// Body: { name?: string, description?: string, logoUrl?: string }
// Response: { success: boolean, company: Company }
companyRouter.patch('/:id', updateCompanyMiddleware);
// #end-route

// #route DELETE /:id - Eliminar compañía
// Params: id (number)
// Response: { success: boolean, message: string }
companyRouter.delete('/:id', deleteCompanyMiddleware);
// #end-route

// #route POST /:id/archive - Archivar compañía
// Params: id (number)
// Response: { success: boolean, company: Company, message: string }
companyRouter.post('/:id/archive', archiveCompanyMiddleware);
// #end-route

// #route POST /:id/reactivate - Reactivar compañía archivada
// Params: id (number)
// Response: { success: boolean, company: Company, message: string }
companyRouter.post('/:id/reactivate', reactivateCompanyMiddleware);
// #end-route

// #route GET /:id/permission - Verificar permisos del usuario sobre la compañía
// Params: id (number)
// Response: { success: boolean, hasPermission: boolean, reason?: string }
companyRouter.get('/:id/permission', checkCompanyPermissionMiddleware);
// #end-route
