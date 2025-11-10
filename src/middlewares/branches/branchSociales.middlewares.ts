/* src/middlewares/branches/branchSocials.middlewares.ts */
// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { branchSocialsTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
// #end-section

// #variable VALID_PLATFORMS
/**
 * Plataformas de redes sociales válidas
 */
const VALID_PLATFORMS = [
  'facebook',
  'instagram',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
  'whatsapp',
  'website'
] as const;
// #end-variable

// #middleware validateCreateSocialPayload
/**
 * Middleware: validateCreateSocialPayload
 * 
 * Valida los datos para crear/actualizar una red social.
 * - platform: obligatorio, uno de los valores válidos
 * - url: obligatorio, string, máx 500 caracteres, formato URL
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCreateSocialPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { platform, url } = req.body;

  // Validar platform (obligatorio)
  if (!platform || typeof platform !== 'string') {
    res.status(400).json({
      success: false,
      error: 'La plataforma es obligatoria'
    });
    return;
  }

  if (!VALID_PLATFORMS.includes(platform as any)) {
    res.status(400).json({
      success: false,
      error: `Plataforma no válida. Debe ser una de: ${VALID_PLATFORMS.join(', ')}`
    });
    return;
  }

  // Validar url (obligatorio)
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'La URL es obligatoria'
    });
    return;
  }

  if (url.trim().length > 500) {
    res.status(400).json({
      success: false,
      error: 'La URL no puede superar los 500 caracteres'
    });
    return;
  }

  // Validar formato de URL básico
  try {
    new URL(url.trim());
  } catch {
    res.status(400).json({
      success: false,
      error: 'La URL no tiene un formato válido'
    });
    return;
  }

  // Normalizar datos
  req.body = {
    platform: platform.toLowerCase().trim(),
    url: url.trim()
  };

  next();
};
// #end-middleware

// #middleware validateSocialId
/**
 * Middleware: validateSocialId
 * 
 * Valida que el ID de la red social en los params sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateSocialId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const socialId = Number(req.params.socialId);

  if (isNaN(socialId) || socialId <= 0) {
    res.status(400).json({
      success: false,
      error: 'ID de red social inválido'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware createBranchSocial
/**
 * Middleware: createBranchSocial
 * 
 * Crea una nueva red social para una sucursal.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createBranchSocial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { platform, url } = req.body;

    // Verificar si ya existe esta plataforma para esta sucursal
    const [existing] = await db
      .select()
      .from(branchSocialsTable)
      .where(
        and(
          eq(branchSocialsTable.branchId, branchId),
          eq(branchSocialsTable.platform, platform)
        )
      )
      .limit(1);

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Esta sucursal ya tiene configurada esta red social'
      });
      return;
    }

    // Crear la red social
    const [newSocial] = await db
      .insert(branchSocialsTable)
      .values({
        branchId,
        platform,
        url
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        social: newSocial
      }
    });
  } catch (error) {
    console.error('Error creando red social:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la red social'
    });
  }
};
// #end-middleware

// #middleware getBranchSocials
/**
 * Middleware: getBranchSocials
 * 
 * Obtiene todas las redes sociales de una sucursal.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getBranchSocials = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    const socials = await db
      .select()
      .from(branchSocialsTable)
      .where(eq(branchSocialsTable.branchId, branchId))
      .orderBy(branchSocialsTable.createdAt);

    res.status(200).json({
      success: true,
      data: {
        socials
      }
    });
  } catch (error) {
    console.error('Error obteniendo redes sociales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las redes sociales'
    });
  }
};
// #end-middleware

// #middleware updateBranchSocial
/**
 * Middleware: updateBranchSocial
 * 
 * Actualiza una red social existente.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateBranchSocial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const socialId = Number(req.params.socialId);
    const { url } = req.body;

    const [updatedSocial] = await db
      .update(branchSocialsTable)
      .set({
        url,
        updatedAt: new Date()
      })
      .where(eq(branchSocialsTable.id, socialId))
      .returning();

    if (!updatedSocial) {
      res.status(404).json({
        success: false,
        error: 'Red social no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        social: updatedSocial
      }
    });
  } catch (error) {
    console.error('Error actualizando red social:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la red social'
    });
  }
};
// #end-middleware

// #middleware deleteBranchSocial
/**
 * Middleware: deleteBranchSocial
 * 
 * Elimina una red social (hard delete).
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteBranchSocial = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const socialId = Number(req.params.socialId);

    const [deletedSocial] = await db
      .delete(branchSocialsTable)
      .where(eq(branchSocialsTable.id, socialId))
      .returning();

    if (!deletedSocial) {
      res.status(404).json({
        success: false,
        error: 'Red social no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Red social eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando red social:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la red social'
    });
  }
};
// #end-middleware