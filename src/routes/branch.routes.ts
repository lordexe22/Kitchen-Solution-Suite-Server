/* src/routes/branches.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import {
  validateCreateBranchPayload,
  validateUpdateBranchPayload,
  validateBranchId,
  verifyBranchOwnership,
  verifyCompanyOwnership,
  createBranch,
  getCompanyBranches,
  getBranchById,
  updateBranch,
  softDeleteBranch,
  validateCreateLocationPayload,
  createBranchLocation,
  getBranchLocation,
  deleteBranchLocation
} from "../middlewares/branches/branches.middlewares";
// #end-section
// #variable branchesRouter
export const branchesRouter = Router();
// #end-variable
// #route POST / - Crear sucursal
/**
 * Crea una nueva sucursal para una compañía.
 * 
 * @route POST /api/branches
 * @access Private
 * 
 * Body: { companyId: number, name?: string }
 */
branchesRouter.post(
  "/",
  validateJWTAndGetPayload,
  validateCreateBranchPayload,
  verifyCompanyOwnership,
  createBranch
);
// #end-route
// #route GET /company/:companyId - Listar sucursales de una compañía
/**
 * Obtiene todas las sucursales activas de una compañía.
 * Incluye las ubicaciones (si existen).
 * Ordenadas por fecha de creación (más antigua primero).
 * 
 * @route GET /api/branches/company/:companyId
 * @access Private
 */
branchesRouter.get(
  "/company/:companyId",
  validateJWTAndGetPayload,
  getCompanyBranches
);
// #end-route
// #route GET /:id - Obtener una sucursal
/**
 * Obtiene los datos de una sucursal específica.
 * Incluye su ubicación si existe.
 * 
 * @route GET /api/branches/:id
 * @access Private
 */
branchesRouter.get(
  "/:id",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  getBranchById
);
// #end-route
// #route PUT /:id - Actualizar sucursal
/**
 * Actualiza el nombre de una sucursal.
 * 
 * @route PUT /api/branches/:id
 * @access Private
 * 
 * Body: { name: string | null }
 */
branchesRouter.put(
  "/:id",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  validateUpdateBranchPayload,
  updateBranch
);
// #end-route
// #route DELETE /:id - Eliminar sucursal (soft delete)
/**
 * Elimina lógicamente una sucursal (soft delete).
 * 
 * @route DELETE /api/branches/:id
 * @access Private
 */
branchesRouter.delete(
  "/:id",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  softDeleteBranch
);
// #end-route
// #route POST /:id/location - Crear/Actualizar ubicación
/**
 * Crea o actualiza la ubicación de una sucursal.
 * 
 * @route POST /api/branches/:id/location
 * @access Private
 * 
 * Body: {
 *   address: string,
 *   city: string,
 *   state: string,
 *   country: string,
 *   postalCode?: string,
 *   latitude?: string,
 *   longitude?: string
 * }
 */
branchesRouter.post(
  "/:id/location",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  validateCreateLocationPayload,
  createBranchLocation
);
// #end-route
// #route GET /:id/location - Obtener ubicación
/**
 * Obtiene la ubicación de una sucursal.
 * 
 * @route GET /api/branches/:id/location
 * @access Private
 */
branchesRouter.get(
  "/:id/location",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  getBranchLocation
);
// #end-route
// #route DELETE /:id/location - Eliminar ubicación
/**
 * Elimina la ubicación de una sucursal.
 * 
 * @route DELETE /api/branches/:id/location
 * @access Private
 */
branchesRouter.delete(
  "/:id/location",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyBranchOwnership,
  deleteBranchLocation
);
// #end-route