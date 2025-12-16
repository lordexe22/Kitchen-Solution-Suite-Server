/* src/routes/branches.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import { requirePermission } from "../middlewares/authorization/authorization.middlewares";
import {
  validateCreateBranchPayload,
  validateUpdateBranchPayload,
  validateBranchId,
  verifyBranchOwnership,
  verifyEmployeeBranchAccess,
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
import { 
  validateSocialId,
  createBranchSocial,
  deleteBranchSocial,
  getBranchSocials,
  updateBranchSocial,
  validateCreateSocialPayload
} from "../middlewares/branches/branchSociales.middlewares";
import { 
  validateScheduleId,
  createBranchSchedule,
  deleteBranchSchedule,
  getBranchSchedules,
  updateBranchSchedule,
  upsertBranchSchedules,
  validateCreateSchedulePayload
} from "../middlewares/branches/branchSchedules.middlewares";
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
// #route POST /:id/socials - Crear red social
/**
 * Crea una nueva red social para una sucursal.
 * 
 * @route POST /api/branches/:id/socials
 * @access Private
 * 
 * Body: {
 *   platform: string,
 *   url: string
 * }
 */
branchesRouter.post(
  "/:id/socials",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('socials', 'canEdit'),
  validateCreateSocialPayload,
  createBranchSocial
);
// #end-route
// #route GET /:id/socials - Obtener redes sociales
/**
 * Obtiene todas las redes sociales de una sucursal.
 * 
 * @route GET /api/branches/:id/socials
 * @access Private
 */
branchesRouter.get(
  "/:id/socials",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('socials', 'canView'),
  getBranchSocials
);
// #end-route
// #route PUT /:id/socials/:socialId - Actualizar red social
/**
 * Actualiza una red social existente.
 * 
 * @route PUT /api/branches/:id/socials/:socialId
 * @access Private
 * 
 * Body: {
 *   url: string
 * }
 */
branchesRouter.put(
  "/:id/socials/:socialId",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('socials', 'canEdit'),
  validateSocialId,
  validateCreateSocialPayload,
  updateBranchSocial
);
// #end-route
// #route DELETE /:id/socials/:socialId - Eliminar red social
/**
 * Elimina una red social.
 * 
 * @route DELETE /api/branches/:id/socials/:socialId
 * @access Private
 */
branchesRouter.delete(
  "/:id/socials/:socialId",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('socials', 'canEdit'),
  validateSocialId,
  deleteBranchSocial
);
// #end-route
// #route POST /:id/schedules - Crear horario
/**
 * Crea un nuevo horario para una sucursal.
 * 
 * @route POST /api/branches/:id/schedules
 * @access Private
 * 
 * Body: {
 *   dayOfWeek: string,
 *   openTime: string,
 *   closeTime: string,
 *   isClosed: boolean
 * }
 */
branchesRouter.post(
  "/:id/schedules",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('schedules', 'canEdit'),
  validateCreateSchedulePayload,
  createBranchSchedule
);
// #end-route

// #route GET /:id/schedules - Obtener horarios
/**
 * Obtiene todos los horarios de una sucursal.
 * 
 * @route GET /api/branches/:id/schedules
 * @access Private
 */
branchesRouter.get(
  "/:id/schedules",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('schedules', 'canView'),
  getBranchSchedules
);
// #end-route

// #route PUT /:id/schedules/batch - Actualizar múltiples horarios
/**
 * Crea o actualiza todos los horarios de una sucursal de una vez.
 * 
 * @route PUT /api/branches/:id/schedules/batch
 * @access Private
 * 
 * Body: {
 *   schedules: [
 *     { dayOfWeek: 'monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
 *     { dayOfWeek: 'sunday', isClosed: true }
 *   ]
 * }
 */
branchesRouter.put(
  "/:id/schedules/batch",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('schedules', 'canEdit'),
  upsertBranchSchedules
);
// #end-route

// #route PUT /:id/schedules/:scheduleId - Actualizar horario
/**
 * Actualiza un horario existente.
 * 
 * @route PUT /api/branches/:id/schedules/:scheduleId
 * @access Private
 * 
 * Body: {
 *   openTime: string,
 *   closeTime: string,
 *   isClosed: boolean
 * }
 */
branchesRouter.put(
  "/:id/schedules/:scheduleId",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('schedules', 'canEdit'),
  validateScheduleId,
  validateCreateSchedulePayload,
  updateBranchSchedule
);
// #end-route

// #route DELETE /:id/schedules/:scheduleId - Eliminar horario
/**
 * Elimina un horario.
 * 
 * @route DELETE /api/branches/:id/schedules/:scheduleId
 * @access Private
 */
branchesRouter.delete(
  "/:id/schedules/:scheduleId",
  validateJWTAndGetPayload,
  validateBranchId,
  verifyEmployeeBranchAccess,
  requirePermission('schedules', 'canEdit'),
  validateScheduleId,
  deleteBranchSchedule
);
// #end-route
