/* src\routes\index.routes.ts */
// #section Imports
import { Router, Response } from "express";
import { API_ROUTES } from "../config/routes.config";
import { jwtManagerRoutes } from "../modules/jwtManager";
import { 
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  fetchUserDataFromDB,
  fetchUserDataByUserId,
  createJWT,
  setJWTonCookies,
  returnUserData,
  validateLoginPayload,
  getUserFromDB,
  savePlatformToken
} from "../middlewares/auth/auth.middlewares";
import { processInvitationIfPresent } from "../middlewares/auth/invitationProcessing.middlewares";
import { validateInvitationTokenMiddleware } from "../middlewares/invitations/invitations.middlewares";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import type { AuthenticatedRequest } from "../modules/jwtManager/jwtManager.types";
import { requireRole } from "../middlewares/authorization/authorization.middlewares";
import { requirePermission } from "../middlewares/authorization/authorization.middlewares";
// #end-section

export const authRouter = Router();

authRouter.use('/jwt', jwtManagerRoutes);

// #route POST /register - Registro normal de usuarios
/**
 * Endpoint de registro tradicional (sin invitación):
 * - Primer usuario → admin (ownership)
 * - Usuarios subsecuentes → guest
 * 
 * @route POST /api/auth/register
 */
authRouter.post(API_ROUTES.REGISTER_URL,
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  savePlatformToken,
  fetchUserDataFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData
)

// #route POST /register/invitation - Registro con invitación de empleado
/**
 * Endpoint de registro con token de invitación:
 * - Requiere token válido en query params
 * - Crea usuario como employee asignado a sucursal
 * - Asigna permisos por defecto
 * 
 * @route POST /api/auth/register/invitation?token={invitationToken}
 * @query token - Token de invitación (requerido)
 */
authRouter.post(`${API_ROUTES.REGISTER_URL}/invitation`,
  validateInvitationTokenMiddleware, // Valida token (requerido en esta ruta)
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  savePlatformToken,
  processInvitationIfPresent, // Convierte a employee
  fetchUserDataFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData
)

authRouter.post(API_ROUTES.LOGIN_URL,
  validateLoginPayload,
  getUserFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData
)

authRouter.post(API_ROUTES.AUTO_LOGIN_BY_TOKEN_URL,
  validateJWTAndGetPayload,
  fetchUserDataByUserId,
  returnUserData
)

// #route GET /test-permissions - Ruta temporal de prueba para sistema de permisos
/**
 * RUTA TEMPORAL DE PRUEBA - Sistema de permisos
 * 
 * Prueba los nuevos middlewares de autorización:
 * - requireRole: verifica tipo de usuario
 * - requirePermission: verifica permisos específicos
 * 
 * Esta ruta debe eliminarse en producción.
 * 
 * @route GET /api/auth/test-permissions
 * @access Private (solo admin y employee)
 */
authRouter.get('/test-permissions',
  validateJWTAndGetPayload,
  requireRole('admin', 'employee'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: '✅ Sistema de permisos funcionando correctamente',
      user: {
        userId: req.user?.userId,
        email: req.user?.email,
        type: req.user?.type,
        branchId: req.user?.branchId,
        permissions: req.user?.permissions ? JSON.parse(req.user.permissions) : null,
        state: req.user?.state,
      }
    });
  }
);

// #route GET /test-permissions/products-edit - Prueba permiso específico
/**
 * RUTA TEMPORAL DE PRUEBA - Permiso de edición de productos
 * 
 * Prueba requirePermission con módulo 'products' y acción 'canEdit'.
 * Admin: siempre pasa (bypass)
 * Employee: debe tener el permiso explícito
 * 
 * @route GET /api/auth/test-permissions/products-edit
 * @access Private (admin bypass, employee con permiso)
 */
authRouter.get('/test-permissions/products-edit',
  validateJWTAndGetPayload,
  requireRole('admin', 'employee'),
  requirePermission('products', 'canEdit'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: '✅ Tienes permiso para editar productos',
      user: {
        userId: req.user?.userId,
        type: req.user?.type,
        branchId: req.user?.branchId,
      }
    });
  }
);

// #route GET /test-permissions/categories-delete - Prueba permiso de eliminación
/**
 * RUTA TEMPORAL DE PRUEBA - Permiso de eliminación de categorías
 * 
 * Prueba requirePermission con módulo 'categories' y acción 'canDelete'.
 * Admin: siempre pasa
 * Employee: debe tener el permiso explícito (probablemente no lo tenga)
 * 
 * @route GET /api/auth/test-permissions/categories-delete
 * @access Private (admin bypass, employee con permiso)
 */
authRouter.get('/test-permissions/categories-delete',
  validateJWTAndGetPayload,
  requireRole('admin', 'employee'),
  requirePermission('categories', 'canDelete'),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: '✅ Tienes permiso para eliminar categorías',
      user: {
        userId: req.user?.userId,
        type: req.user?.type,
      }
    });
  }
);
// #end-route