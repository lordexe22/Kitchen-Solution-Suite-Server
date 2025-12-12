/* src/middlewares/auth/invitationProcessing.middlewares.ts */

// #section Imports
import { Request, Response, NextFunction } from "express";
import { db } from "../../db/init";
import { usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_EMPLOYEE_PERMISSIONS } from "../../config/permissions.config";
// #end-section

// #middleware processInvitationIfPresent
/**
 * Middleware: processInvitationIfPresent
 * 
 * Si el registro viene con un token de invitación válido, convierte al usuario
 * de 'guest' a 'employee' y asigna la sucursal correspondiente.
 * 
 * También marca la invitación como usada.
 * 
 * Debe ejecutarse DESPUÉS de addNewUserDataToDB (usuario ya está en BD).
 * 
 * Body params (opcionales):
 * - invitationToken: string (token de invitación)
 * - invitationData: object { branchId, companyId, ... }
 */
export const processInvitationIfPresent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Leer de req.body o res.locals (puede haber sido sobreescrito antes)
    const invitationToken = (req.body as any)?.invitationToken ?? (res.locals as any)?.invitationToken;
    const invitationData = (req.body as any)?.invitationData ?? (res.locals as any)?.invitationData;
    const { email } = req.body;

    // #step 1 - Si no hay invitación, continuar normalmente
    if (!invitationToken || !invitationData) {
      console.log('[processInvitationIfPresent] Sin invitación, usuario registrado como guest');
      return next();
    }
    // #end-step

    // #step 2 - Importar services de invitaciones (aquí para evitar circular deps)
    const { markInvitationAsUsed } = await import('../../services/invitations/invitations.services');
    // #end-step

    // #step 3 - Obtener usuario recién creado
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      console.warn('[processInvitationIfPresent] Usuario no encontrado después del registro');
      return next();
    }
    // #end-step

    // #step 4 - Actualizar usuario a employee con permisos defaults
    const permissionsJson = JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS);

    await db
      .update(usersTable)
      .set({
        type: 'employee',
        branchId: invitationData.branchId,
        permissions: permissionsJson,
        state: 'active',
        isActive: true
      })
      .where(eq(usersTable.id, user.id));
    // #end-step

    // #step 5 - Marcar invitación como usada
    await markInvitationAsUsed(invitationToken, user.id);
    // #end-step

    // #step 6 - Actualizar req.body para que los siguientes middlewares usen los datos correctos
    req.body.type = 'employee';
    req.body.branchId = invitationData.branchId;
    req.body.permissions = permissionsJson;
    // #end-step

    // #step 7 - Log
    console.log(
      `[processInvitationIfPresent] ✓ Usuario convertido a employee - ID: ${user.id} | Email: ${email} | Branch: ${invitationData.branchId}`
    );
    // #end-step

    next();
  } catch (err) {
    console.error('[processInvitationIfPresent] Error procesando invitación:', err);
    // No fallar si hay error con invitación, dejar que continúe normalmente
    next();
  }
};
// #end-middleware
