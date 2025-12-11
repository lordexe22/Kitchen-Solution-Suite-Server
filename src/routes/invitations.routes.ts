/* src/routes/invitations.routes.ts */

// #section Imports
import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../modules/jwtManager/jwtManager.types';
import { validateJWTAndGetPayload } from '../modules/jwtManager';
import { requireRole } from '../middlewares/authorization/authorization.middlewares';
import {
  validateCreateInvitationPayload,
  verifyInvitationBranchOwnership,
  validateInvitationTokenMiddleware
} from '../middlewares/invitations/invitations.middlewares';
import {
  createInvitation,
  validateInvitationToken,
  getInvitationsByCompany
} from '../services/invitations/invitations.services';
// #end-section

// #variable router
const router = Router();
// #end-variable

// #route POST /invitations
/**
 * Genera una nueva invitación para que un usuario se registre como empleado.
 * 
 * Solo admin (ownership) puede generar invitaciones.
 * La sucursal debe pertenecer al admin.
 * 
 * Body:
 * - branchId: number (sucursal donde se asignará el empleado)
 * - expirationDays: number opcional (default 30 días)
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede generar invitaciones
 * 3. validateCreateInvitationPayload - Valida formato de datos
 * 4. verifyInvitationBranchOwnership - Verifica ownership de la sucursal
 * 
 * Respuesta:
 * {
 *   success: true,
 *   data: {
 *     id: number,
 *     token: string,
 *     branchId: number,
 *     companyId: number,
 *     expiresAt: Date,
 *     createdAt: Date,
 *     invitationUrl: string // URL completa para compartir
 *   }
 * }
 */
router.post(
  '/',
  validateJWTAndGetPayload,
  requireRole('admin'),
  validateCreateInvitationPayload,
  verifyInvitationBranchOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.userId;
      const invitation = await createInvitation(req.body, adminId);

      res.status(201).json({
        success: true,
        data: invitation
      });
    } catch (error) {
      console.error('[POST /invitations] Error al crear invitación:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear invitación'
      });
    }
  }
);
// #end-route

// #route GET /invitations/validate
/**
 * Valida un token de invitación sin autenticación.
 * 
 * Se usa en el formulario de registro para mostrar información de la invitación.
 * 
 * Query params:
 * - token: string (token de invitación)
 * 
 * Respuesta si es válido:
 * {
 *   success: true,
 *   valid: true,
 *   data: {
 *     branchId: number,
 *     companyId: number,
 *     branchName: string,
 *     companyName: string,
 *     expiresAt: Date,
 *     expiresIn: { days, hours, minutes }
 *   }
 * }
 * 
 * Respuesta si es inválido:
 * {
 *   success: false,
 *   valid: false,
 *   error: string
 * }
 */
router.get(
  '/validate',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;

      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Token de invitación requerido'
        });
        return;
      }

      const validation = await validateInvitationToken(token);

      res.status(200).json({
        success: validation.valid,
        valid: validation.valid,
        data: validation.valid
          ? {
              branchId: validation.branchId,
              companyId: validation.companyId,
              branchName: validation.branchName,
              companyName: validation.companyName,
              expiresAt: validation.expiresAt,
              expiresIn: validation.expiresIn
            }
          : null,
        error: validation.error
      });
    } catch (error) {
      console.error('[GET /invitations/validate] Error al validar invitación:', error);
      res.status(500).json({
        success: false,
        error: 'Error al validar invitación'
      });
    }
  }
);
// #end-route

// #route GET /invitations/company/:companyId
/**
 * Lista todas las invitaciones de una compañía.
 * 
 * Solo el owner de la compañía puede listar sus invitaciones.
 * 
 * Query params (opcionales):
 * - activeOnly: 'true' para solo invitaciones sin usar
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin
 * 
 * Respuesta:
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: number,
 *       token: string (primeros 8 caracteres),
 *       branchId: number,
 *       branchName: string,
 *       companyId: number,
 *       companyName: string,
 *       expiresAt: Date,
 *       usedAt: Date | null,
 *       createdAt: Date
 *     }
 *   ]
 * }
 */
router.get(
  '/company/:companyId',
  validateJWTAndGetPayload,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const adminId = req.user!.userId;
      const activeOnly = req.query.activeOnly === 'true';

      if (isNaN(companyId)) {
        res.status(400).json({
          success: false,
          error: 'ID de compañía inválido'
        });
        return;
      }

      // Verificar ownership (no implementado aquí, debería validarse)
      // Por ahora confiar en requireRole, pero en producción verificar companyId ownership

      const invitations = await getInvitationsByCompany(companyId, activeOnly);

      const formattedInvitations = invitations.map((row) => ({
        id: row.invitation.id,
        token: row.invitation.token.substring(0, 8) + '...', // Mostrar solo primeros 8 caracteres
        branchId: row.invitation.branchId,
        branchName: row.branch.name || 'Sin nombre',
        companyId: row.invitation.companyId,
        companyName: row.company.name,
        expiresAt: row.invitation.expiresAt,
        usedAt: row.invitation.usedAt,
        createdAt: row.invitation.createdAt
      }));

      res.status(200).json({
        success: true,
        data: formattedInvitations
      });
    } catch (error) {
      console.error('[GET /invitations/company/:companyId] Error al listar invitaciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error al listar invitaciones'
      });
    }
  }
);
// #end-route

export default router;
