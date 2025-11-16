// src/middlewares/users/users.middlewares.ts

// #section Imports
import { Response } from "express";
import { db } from "../../db/init";
import { usersTable, pendingDeletionsTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { uploadFile, deleteFile, loadConfig, CLOUDINARY_FOLDERS, NotFoundError } from '../../modules/cloudinary';
// #end-section

// #middleware uploadUserAvatar
/**
 * Middleware: uploadUserAvatar
 * 
 * Sube o actualiza el avatar de un usuario en Cloudinary.
 * Actualiza el campo imageUrl en la base de datos.
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * - uploadSingleFile('avatar') (para obtener req.file)
 * - validateFileExists (para verificar que existe archivo)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y file
 * @param {Response} res - Response de Express
 */
export const uploadUserAvatar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir folder y publicId usando helper
    const { folder, publicId } = CLOUDINARY_FOLDERS.users.avatars(
      userId,
      rootFolder
    );

    // Subir archivo a Cloudinary
    const uploadResult = await uploadFile(req.file!.buffer, {
      folder,
      publicId,
      overwrite: true, // Sobrescribir si ya existe
      resourceType: 'image',
      tags: ['user-avatar', `user-${userId}`],
    });

    // Actualizar imageUrl en la base de datos
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        imageUrl: uploadResult.secureUrl,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          imageUrl: updatedUser.imageUrl,
        },
        cloudinary: {
          publicId: uploadResult.publicId,
          url: uploadResult.secureUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Error uploading user avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
      details: error.message,
    });
  }
};
// #end-middleware

// #middleware deleteUserAvatar
/**
 * Middleware: deleteUserAvatar
 * 
 * Elimina el avatar de un usuario de Cloudinary y actualiza la BD.
 * Maneja casos donde la imagen no existe en Cloudinary (no falla).
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteUserAvatar = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Verificar que el usuario tiene avatar
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || !user.imageUrl) {
      res.status(400).json({
        success: false,
        error: 'User does not have an avatar',
      });
      return;
    }

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir publicId completo
    const { folder, publicId } = CLOUDINARY_FOLDERS.users.avatars(
      userId,
      rootFolder
    );
    const fullPublicId = `${folder}/${publicId}`;

    // Intentar eliminar de Cloudinary (no falla si no existe)
    try {
      await deleteFile(fullPublicId, {
        resourceType: 'image',
      });
      console.log(`Avatar eliminado de Cloudinary: ${fullPublicId}`);
    } catch (cloudinaryError: any) {
      if (cloudinaryError instanceof NotFoundError) {
        console.warn(`Avatar no encontrado en Cloudinary: ${fullPublicId} (ya fue eliminado)`);
      } else {
        console.error('Error eliminando avatar de Cloudinary:', cloudinaryError.message);
      }
    }

    // Actualizar imageUrl en la base de datos (setear a null)
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        imageUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          imageUrl: updatedUser.imageUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Error deleting user avatar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar',
      details: error.message,
    });
  }
};
// #end-middleware

// #middleware softDeleteUser
/**
 * Middleware: softDeleteUser
 * 
 * Elimina lógicamente un usuario (soft delete) con período de gracia de 30 días.
 * Registra la eliminación en pending_deletions para procesamiento posterior.
 * NO elimina el avatar de Cloudinary inmediatamente (se eliminará en hard delete).
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const softDeleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Obtener el usuario actual
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
      return;
    }

    // Calcular fecha de eliminación definitiva (30 días desde ahora)
    const now = new Date();
    const scheduledDeletion = new Date(now);
    scheduledDeletion.setDate(scheduledDeletion.getDate() + 30);

    // 1. Registrar en pending_deletions
    await db.insert(pendingDeletionsTable).values({
      entityType: 'user',
      entityId: userId,
      scheduledAt: scheduledDeletion,
      requestedBy: userId,
    });

    // 2. Soft delete en users table
    await db
      .update(usersTable)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId));

    res.status(200).json({
      success: true,
      message: 'Cuenta marcada para eliminación',
      data: {
        scheduledDeletionAt: scheduledDeletion.toISOString(),
        daysRemaining: 30,
      }
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la cuenta'
    });
  }
};
// #end-middleware

// #middleware recoverDeletedAccount
/**
 * Middleware: recoverDeletedAccount
 * 
 * Recupera una cuenta que fue marcada para eliminación (dentro del período de gracia).
 * Elimina el registro de pending_deletions y reactiva la cuenta.
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const recoverDeletedAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Verificar que existe un pending deletion para este usuario
    const [pendingDeletion] = await db
      .select()
      .from(pendingDeletionsTable)
      .where(
        and(
          eq(pendingDeletionsTable.entityType, 'user'),
          eq(pendingDeletionsTable.entityId, userId)
        )
      )
      .limit(1);

    if (!pendingDeletion) {
      res.status(400).json({
        success: false,
        error: 'Esta cuenta no está programada para eliminación'
      });
      return;
    }

    // Verificar que no ha pasado el período de gracia
    const now = new Date();
    if (pendingDeletion.scheduledAt < now) {
      res.status(400).json({
        success: false,
        error: 'El período de gracia ha expirado. La cuenta no puede ser recuperada'
      });
      return;
    }

    // 1. Eliminar de pending_deletions
    await db
      .delete(pendingDeletionsTable)
      .where(eq(pendingDeletionsTable.id, pendingDeletion.id));

    // 2. Restaurar la cuenta
    const [recoveredUser] = await db
      .update(usersTable)
      .set({
        isActive: true,
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Cuenta recuperada exitosamente',
      data: {
        user: {
          id: recoveredUser.id,
          email: recoveredUser.email,
          firstName: recoveredUser.firstName,
          lastName: recoveredUser.lastName,
          imageUrl: recoveredUser.imageUrl,
        },
      }
    });
  } catch (error) {
    console.error('Error recuperando cuenta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al recuperar la cuenta'
    });
  }
};
// #end-middleware