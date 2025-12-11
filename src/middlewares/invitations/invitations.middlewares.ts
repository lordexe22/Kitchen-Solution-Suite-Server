/* src/middlewares/invitations/invitations.middlewares.ts */

// #section Imports
import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../modules/jwtManager/jwtManager.types';
import { db } from '../../db/init';
import { branchesTable, companiesTable, employeeInvitationsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { validateInvitationToken } from '../../services/invitations/invitations.services';
// #end-section

// #middleware validateCreateInvitationPayload
/**
 * Valida los datos para crear una invitación.
 * 
 * Campos requeridos:
 * - branchId: number, sucursal existente
 * - expirationDays: number, opcional (default 30)
 */
export const validateCreateInvitationPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { branchId, expirationDays } = req.body;

  // #step 1 - Validar branchId
  if (!branchId || typeof branchId !== 'number') {
    res.status(400).json({
      success: false,
      error: 'El ID de sucursal es obligatorio y debe ser un número'
    });
    return;
  }
  // #end-step

  // #step 2 - Validar expirationDays (opcional)
  if (expirationDays !== undefined) {
    if (typeof expirationDays !== 'number' || expirationDays < 1 || expirationDays > 365) {
      res.status(400).json({
        success: false,
        error: 'Los días de expiración deben estar entre 1 y 365'
      });
      return;
    }
  }
  // #end-step

  // #step 3 - Normalizar datos
  req.body = {
    branchId,
    expirationDays: expirationDays || 30
  };
  // #end-step

  next();
};
// #end-middleware

// #middleware verifyInvitationBranchOwnership
/**
 * Verifica que la sucursal pertenezca a una compañía del admin.
 * 
 * Debe ejecutarse DESPUÉS de validateCreateInvitationPayload.
 */
export const verifyInvitationBranchOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { branchId } = req.body;
  const adminId = req.user?.userId;

  if (!adminId) {
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado'
    });
    return;
  }

  // #step 1 - Buscar sucursal con join a company
  const [branchData] = await db
    .select({
      branch: branchesTable,
      company: companiesTable
    })
    .from(branchesTable)
    .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
    .where(eq(branchesTable.id, branchId));

  if (!branchData) {
    res.status(404).json({
      success: false,
      error: 'Sucursal no encontrada'
    });
    return;
  }
  // #end-step

  // #step 2 - Verificar ownership
  if (branchData.company.ownerId !== adminId) {
    console.warn(
      `[verifyInvitationBranchOwnership] Acceso denegado - Admin ID: ${adminId} intentó generar invitación para sucursal ID: ${branchId} de compañía ID: ${branchData.company.id} (Owner: ${branchData.company.ownerId})`
    );
    res.status(403).json({
      success: false,
      error: 'No tienes permisos para generar invitaciones en esta sucursal'
    });
    return;
  }
  // #end-step

  // #step 3 - Guardar companyId en req
  req.body.companyId = branchData.company.id;
  // #end-step

  next();
};
// #end-middleware

// #middleware validateInvitationTokenMiddleware
/**
 * Valida un token de invitación desde query params.
 * 
 * Se ejecuta al acceder al endpoint de validación o durante el registro.
 * Agrega los datos de la invitación a req.body para uso posterior.
 * 
 * Query param:
 * - token: string (token de invitación)
 */
export const validateInvitationTokenMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.query.token as string;

  // #step 1 - Validar que el token fue proporcionado
  if (!token || typeof token !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Token de invitación requerido'
    });
    return;
  }
  // #end-step

  // #step 2 - Validar el token usando el servicio
  const validation = await validateInvitationToken(token);
  // #end-step

  // #step 3 - Si no es válido, retornar error
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: validation.error
    });
    return;
  }
  // #end-step

  // #step 4 - Guardar datos validados en req para uso posterior
  req.body.invitationToken = token;
  req.body.invitationData = {
    branchId: validation.branchId,
    companyId: validation.companyId,
    branchName: validation.branchName,
    companyName: validation.companyName
  };
  // #end-step

  next();
};
// #end-middleware
