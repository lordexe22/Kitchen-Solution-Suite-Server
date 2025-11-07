/* src/routes/companies.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import {
  validateCreateCompanyPayload,
  validateUpdateCompanyPayload,
  validateCompanyId,
  verifyCompanyOwnership,
  createCompany,
  getUserCompanies,
  getCompanyById,
  updateCompany,
  softDeleteCompany,
  checkCompanyNameAvailability
} from "../middlewares/companies/companies.middlewares";
// #end-section
// #variable companiesRouter
export const companiesRouter = Router();
// #end-variable
// #route POST / - Crear compañía
/**
 * Crea una nueva compañía.
 * 
 * @route POST /api/companies
 * @access Private
 * 
 * Body: { name: string, description?: string, logoUrl?: string }
 */
companiesRouter.post(
  "/",
  validateJWTAndGetPayload,
  validateCreateCompanyPayload,
  createCompany
);
// #end-route
// #route GET / - Listar mis compañías
/**
 * Obtiene todas las compañías del usuario autenticado.
 * 
 * @route GET /api/companies
 * @access Private
 */
companiesRouter.get(
  "/",
  validateJWTAndGetPayload,
  getUserCompanies
);
// #end-route
// #route POST /check-name - Verificar disponibilidad de nombre
/**
 * Verifica si un nombre de compañía está disponible.
 * 
 * @route POST /api/companies/check-name
 * @access Private
 * 
 * Body: { name: string }
 * Response: { available: boolean }
 */
companiesRouter.post(
  "/check-name",
  validateJWTAndGetPayload,
  checkCompanyNameAvailability
);
// #end-route
// #route GET /:id - Obtener una compañía
/**
 * Obtiene los datos de una compañía específica.
 * 
 * @route GET /api/companies/:id
 * @access Private
 */
companiesRouter.get(
  "/:id",
  validateJWTAndGetPayload,
  validateCompanyId,
  verifyCompanyOwnership,
  getCompanyById
);
// #end-route
// #route PUT /:id - Actualizar compañía
/**
 * Actualiza los datos de una compañía.
 * 
 * @route PUT /api/companies/:id
 * @access Private
 * 
 * Body: { name?: string, description?: string, logoUrl?: string }
 */
companiesRouter.put(
  "/:id",
  validateJWTAndGetPayload,
  validateCompanyId,
  verifyCompanyOwnership,
  validateUpdateCompanyPayload,
  updateCompany
);
// #end-route
// #route DELETE /:id - Eliminar compañía (soft delete)
/**
 * Elimina lógicamente una compañía (soft delete).
 * 
 * @route DELETE /api/companies/:id
 * @access Private
 */
companiesRouter.delete(
  "/:id",
  validateJWTAndGetPayload,
  validateCompanyId,
  verifyCompanyOwnership,
  softDeleteCompany
);
// #end-route
