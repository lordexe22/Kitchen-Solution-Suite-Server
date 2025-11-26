/* src/routes/users.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import {
  uploadUserAvatar,
  deleteUserAvatar,
  softDeleteUser,
  recoverDeletedAccount,
} from "../middlewares/users/users.middlewares";
import { 
  uploadSingleFile,
  handleFileUploadError,
  validateFileExists,
} from "../middlewares/fileUpload/fileUpload.middleware";
import {
  validateCreateUserTagPayload,
  validateTagId,
  verifyUserTagOwnership,
  createUserTag,
  getUserTags,
  deleteUserTag
} from "../middlewares/users/userTags.middlewares";
// #end-section

// #variable usersRouter
export const usersRouter = Router();
// #end-variable

// #route POST /avatar - Subir/actualizar avatar de usuario
/**
 * Sube o actualiza el avatar de un usuario.
 * 
 * @route POST /api/users/avatar
 * @access Private
 */
usersRouter.post(
  '/avatar',
  validateJWTAndGetPayload,
  uploadSingleFile('avatar'),
  validateFileExists,
  uploadUserAvatar,
  handleFileUploadError
);
// #end-route

// #route DELETE /avatar - Eliminar avatar de usuario
/**
 * Elimina el avatar de un usuario.
 * 
 * @route DELETE /api/users/avatar
 * @access Private
 */
usersRouter.delete(
  '/avatar',
  validateJWTAndGetPayload,
  deleteUserAvatar
);
// #end-route

// #route DELETE /account - Eliminar cuenta (soft delete)
/**
 * Marca la cuenta del usuario para eliminación (soft delete con 30 días de gracia).
 * 
 * @route DELETE /api/users/account
 * @access Private
 */
usersRouter.delete(
  '/account',
  validateJWTAndGetPayload,
  softDeleteUser
);
// #end-route

// #route POST /account/recover - Recuperar cuenta eliminada
/**
 * Recupera una cuenta marcada para eliminación (dentro del período de gracia).
 * 
 * @route POST /api/users/account/recover
 * @access Private
 */
usersRouter.post(
  '/account/recover',
  validateJWTAndGetPayload,
  recoverDeletedAccount
);
// #end-route
// #route POST /tags - Crear etiqueta personalizada
/**
 * Crea una nueva etiqueta personalizada para el usuario.
 * 
 * @route POST /api/users/tags
 * @access Private
 * 
 * Body: {
 *   tagConfig: string (JSON stringificado de TagConfiguration)
 * }
 */
usersRouter.post(
  '/tags',
  validateJWTAndGetPayload,
  validateCreateUserTagPayload,
  createUserTag
);
// #end-route

// #route GET /tags - Obtener etiquetas personalizadas
/**
 * Obtiene todas las etiquetas personalizadas del usuario autenticado.
 * 
 * @route GET /api/users/tags
 * @access Private
 */
usersRouter.get(
  '/tags',
  validateJWTAndGetPayload,
  getUserTags
);
// #end-route

// #route DELETE /tags/:tagId - Eliminar etiqueta personalizada
/**
 * Elimina una etiqueta personalizada del usuario.
 * No afecta a los productos que la tienen asignada.
 * 
 * @route DELETE /api/users/tags/:tagId
 * @access Private
 */
usersRouter.delete(
  '/tags/:tagId',
  validateJWTAndGetPayload,
  validateTagId,
  verifyUserTagOwnership,
  deleteUserTag
);
// #end-route

export default usersRouter;