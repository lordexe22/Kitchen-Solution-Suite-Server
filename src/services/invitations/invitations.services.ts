/* src/services/invitations/invitations.services.ts */

// #section Imports
import { db } from '../../db/init';
import { employeeInvitationsTable, branchesTable, companiesTable } from '../../db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import type { InvitationCreateDTO, InvitationResponse, InvitationValidationPayload } from './invitations.types';
// #end-section

// #function generateInvitationToken
/**
 * Genera un token único y aleatorio para la invitación.
 * 
 * Usa UUID v4 o hash aleatorio (32 bytes en hex = 64 caracteres).
 * 
 * @returns Token único en formato string
 */
const generateInvitationToken = (): string => {
  return randomBytes(32).toString('hex');
};
// #end-function

// #function createInvitation
/**
 * Crea una nueva invitación para que un usuario se registre como empleado.
 * 
 * Validaciones previas (deben hacerse en middleware):
 * - Admin debe ser dueño de la compañía
 * - La sucursal debe pertenecer a esa compañía
 * 
 * @param data - DTO con branchId, companyId y expirationDays opcional
 * @param createdByUserId - ID del owner que crea la invitación
 * @returns Invitación creada con URL lista para compartir
 * @throws Error si la sucursal o compañía no existen
 */
export const createInvitation = async (
  data: InvitationCreateDTO,
  createdByUserId: number
): Promise<InvitationResponse> => {
  const expirationDays = data.expirationDays || 30;
  const token = generateInvitationToken();
  
  // #step 1 - Calcular fecha de expiración
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  // #end-step

  // #step 2 - Insertar invitación
  const [invitation] = await db
    .insert(employeeInvitationsTable)
    .values({
      token,
      branchId: data.branchId,
      companyId: data.companyId,
      createdBy: createdByUserId,
      expiresAt
    })
    .returning();
  // #end-step

  // #step 3 - Armar URL de invitación
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?invitation=${token}`;
  // #end-step

  // #step 4 - Log
  console.log(
    `[createInvitation] ✓ Invitación creada - Token: ${token.substring(0, 8)}... | Branch: ${data.branchId} | Created by: ${createdByUserId}`
  );
  // #end-step

  // #step 5 - Retornar respuesta
  return {
    id: invitation.id,
    token: invitation.token,
    branchId: invitation.branchId,
    companyId: invitation.companyId,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    invitationUrl
  };
  // #end-step
};
// #end-function

// #function validateInvitationToken
/**
 * Valida que una invitación sea válida (existe, no expiró, no fue usada).
 * 
 * Se ejecuta durante el registro para verificar que el token es legítimo.
 * 
 * @param token - Token de invitación a validar
 * @returns Objeto con validación y datos de la invitación
 */
export const validateInvitationToken = async (token: string): Promise<InvitationValidationPayload> => {
  // #step 1 - Buscar invitación con joins a branch y company
  const [invitationData] = await db
    .select({
      invitation: employeeInvitationsTable,
      branch: branchesTable,
      company: companiesTable
    })
    .from(employeeInvitationsTable)
    .innerJoin(branchesTable, eq(employeeInvitationsTable.branchId, branchesTable.id))
    .innerJoin(companiesTable, eq(employeeInvitationsTable.companyId, companiesTable.id))
    .where(
      and(
        eq(employeeInvitationsTable.token, token),
        eq(employeeInvitationsTable.isActive, true)
      )
    );

  if (!invitationData) {
    console.warn(`[validateInvitationToken] Token no encontrado: ${token.substring(0, 8)}...`);
    return {
      valid: false,
      token,
      branchId: 0,
      companyId: 0,
      branchName: '',
      companyName: '',
      expiresAt: new Date(),
      expiresIn: { days: 0, hours: 0, minutes: 0 },
      error: 'Token de invitación no válido'
    };
  }
  // #end-step

  // #step 2 - Verificar que no fue usado
  if (invitationData.invitation.usedAt) {
    console.warn(`[validateInvitationToken] Token ya fue usado: ${token.substring(0, 8)}...`);
    return {
      valid: false,
      token,
      branchId: invitationData.invitation.branchId,
      companyId: invitationData.invitation.companyId,
      branchName: invitationData.branch.name || '',
      companyName: invitationData.company.name,
      expiresAt: invitationData.invitation.expiresAt,
      expiresIn: { days: 0, hours: 0, minutes: 0 },
      error: 'Esta invitación ya fue utilizada'
    };
  }
  // #end-step

  // #step 3 - Verificar expiración
  const now = new Date();
  if (now > invitationData.invitation.expiresAt) {
    console.warn(`[validateInvitationToken] Token expirado: ${token.substring(0, 8)}...`);
    return {
      valid: false,
      token,
      branchId: invitationData.invitation.branchId,
      companyId: invitationData.invitation.companyId,
      branchName: invitationData.branch.name || '',
      companyName: invitationData.company.name,
      expiresAt: invitationData.invitation.expiresAt,
      expiresIn: { days: 0, hours: 0, minutes: 0 },
      error: 'Esta invitación ha expirado'
    };
  }
  // #end-step

  // #step 4 - Calcular tiempo restante
  const diffMs = invitationData.invitation.expiresAt.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;
  // #end-step

  // #step 5 - Log y retornar
  console.log(
    `[validateInvitationToken] ✓ Token válido - Expira en: ${days}d ${hours}h ${minutes}m`
  );
  return {
    valid: true,
    token,
    branchId: invitationData.invitation.branchId,
    companyId: invitationData.invitation.companyId,
    branchName: invitationData.branch.name || 'Sin nombre',
    companyName: invitationData.company.name,
    expiresAt: invitationData.invitation.expiresAt,
    expiresIn: { days, hours, minutes }
  };
  // #end-step
};
// #end-function

// #function markInvitationAsUsed
/**
 * Marca una invitación como usada (registra el momento y usuario que la usó).
 * 
 * Se ejecuta DESPUÉS de crear exitosamente al usuario employee.
 * Debe transaccionarse junto con la creación del usuario.
 * 
 * @param token - Token de invitación
 * @param usedByUserId - ID del usuario que usó el token
 * @throws Error si no puede marcar como usado
 */
export const markInvitationAsUsed = async (token: string, usedByUserId: number): Promise<void> => {
  // #step 1 - Actualizar invitación
  const [updated] = await db
    .update(employeeInvitationsTable)
    .set({
      usedAt: new Date(),
      usedByUserId
    })
    .where(eq(employeeInvitationsTable.token, token))
    .returning();
  // #end-step

  if (!updated) {
    throw new Error('No se pudo marcar la invitación como usada');
  }

  // #step 2 - Log
  console.log(
    `[markInvitationAsUsed] ✓ Invitación marcada como usada - Token: ${token.substring(0, 8)}... | User: ${usedByUserId}`
  );
  // #end-step
};
// #end-function

// #function getInvitationsByCompany
/**
 * Lista todas las invitaciones de una compañía (activas e inactivas).
 * 
 * Útil para que el ownership vea el histórico de invitaciones que ha generado.
 * 
 * @param companyId - ID de la compañía
 * @param activeOnly - Si true, solo retorna invitaciones no usadas
 * @returns Array de invitaciones con info de branch y company
 */
export const getInvitationsByCompany = async (
  companyId: number,
  activeOnly: boolean = false
): Promise<Array<any>> => {
  let query = db
    .select({
      invitation: employeeInvitationsTable,
      branch: branchesTable,
      company: companiesTable
    })
    .from(employeeInvitationsTable)
    .innerJoin(branchesTable, eq(employeeInvitationsTable.branchId, branchesTable.id))
    .innerJoin(companiesTable, eq(employeeInvitationsTable.companyId, companiesTable.id))
    .where(eq(employeeInvitationsTable.companyId, companyId));

  if (activeOnly) {
    query = db
      .select({
        invitation: employeeInvitationsTable,
        branch: branchesTable,
        company: companiesTable
      })
      .from(employeeInvitationsTable)
      .innerJoin(branchesTable, eq(employeeInvitationsTable.branchId, branchesTable.id))
      .innerJoin(companiesTable, eq(employeeInvitationsTable.companyId, companiesTable.id))
      .where(
        and(
          eq(employeeInvitationsTable.companyId, companyId),
          isNull(employeeInvitationsTable.usedAt)
        )
      ) as typeof query;
  }

  return await query;
};
// #end-function
