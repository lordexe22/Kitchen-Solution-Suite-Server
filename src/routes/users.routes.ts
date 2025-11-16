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

export default usersRouter;