/* src/middlewares/users/userTags.middlewares.ts */
// #section Imports
import { Response } from "express";
import { db } from "../../db/init";
import { userTagsTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager";
// #end-section

// #middleware validateCreateUserTagPayload
/**
 * Middleware: validateCreateUserTagPayload
 * 
 * Valida el payload para crear una etiqueta personalizada.
 * Espera: { tagConfig: string } (JSON stringificado)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
export const validateCreateUserTagPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): void => {
  const { tagConfig } = req.body;

  // Validar que tagConfig existe
  if (!tagConfig || typeof tagConfig !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El campo tagConfig es requerido y debe ser un string JSON válido'
    });
    return;
  }

  // Validar que es JSON válido
  try {
    const parsed = JSON.parse(tagConfig);
    
    // Validar estructura mínima de TagConfiguration
    if (
      !parsed.name ||
      !parsed.textColor ||
      !parsed.backgroundColor ||
      typeof parsed.hasBorder !== 'boolean' ||
      !['small', 'medium', 'large'].includes(parsed.size)
    ) {
      res.status(400).json({
        success: false,
        error: 'La configuración de la etiqueta no tiene la estructura válida'
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'El tagConfig debe ser un JSON válido'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware validateTagId
/**
 * Middleware: validateTagId
 * 
 * Valida que el ID de la etiqueta sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
export const validateTagId = (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): void => {
  const tagId = Number(req.params.tagId);

  if (isNaN(tagId) || tagId <= 0) {
    res.status(400).json({
      success: false,
      error: 'ID de etiqueta inválido'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware verifyUserTagOwnership
/**
 * Middleware: verifyUserTagOwnership
 * 
 * Verifica que la etiqueta pertenezca al usuario autenticado.
 * Requiere que validateTagId se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
export const verifyUserTagOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const tagId = Number(req.params.tagId);

    const [tag] = await db
      .select()
      .from(userTagsTable)
      .where(
        and(
          eq(userTagsTable.id, tagId),
          eq(userTagsTable.userId, userId)
        )
      )
      .limit(1);

    if (!tag) {
      res.status(404).json({
        success: false,
        error: 'Etiqueta no encontrada o no tienes permisos'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de etiqueta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar la etiqueta'
    });
  }
};
// #end-middleware

// #middleware createUserTag
/**
 * Middleware: createUserTag
 * 
 * Crea una nueva etiqueta personalizada para el usuario.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createUserTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { tagConfig } = req.body;

    const [newTag] = await db
      .insert(userTagsTable)
      .values({
        userId,
        tagConfig
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        tag: newTag
      }
    });
  } catch (error) {
    console.error('Error creando etiqueta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la etiqueta'
    });
  }
};
// #end-middleware

// #middleware getUserTags
/**
 * Middleware: getUserTags
 * 
 * Obtiene todas las etiquetas personalizadas del usuario autenticado.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getUserTags = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const tags = await db
      .select()
      .from(userTagsTable)
      .where(eq(userTagsTable.userId, userId))
      .orderBy(userTagsTable.createdAt);

    res.status(200).json({
      success: true,
      data: {
        tags
      }
    });
  } catch (error) {
    console.error('Error obteniendo etiquetas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las etiquetas'
    });
  }
};
// #end-middleware

// #middleware deleteUserTag
/**
 * Middleware: deleteUserTag
 * 
 * Elimina una etiqueta personalizada del usuario.
 * NO elimina la etiqueta de los productos que la tienen asignada.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteUserTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tagId = Number(req.params.tagId);

    await db
      .delete(userTagsTable)
      .where(eq(userTagsTable.id, tagId));

    res.status(200).json({
      success: true,
      message: 'Etiqueta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando etiqueta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la etiqueta'
    });
  }
};
// #end-middleware