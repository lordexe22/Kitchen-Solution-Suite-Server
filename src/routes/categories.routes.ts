/* src/routes/categories.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import {
  uploadCategoryImage,
  deleteCategoryImage,
} from "../middlewares/categories/categories.middlewares";
import { 
  uploadSingleFile,
  handleFileUploadError,
  validateFileExists,
} from "../middlewares/fileUpload/fileUpload.middleware";
// #end-section

// #variable categoriesRouter
export const categoriesRouter = Router();
// #end-variable

// #route POST /:id/image - Subir imagen de categoría
/**
 * Sube o actualiza la imagen de una categoría.
 * 
 * @route POST /api/categories/:id/image
 * @access Private
 */
categoriesRouter.post(
  '/:id/image',
  validateJWTAndGetPayload,
  uploadSingleFile('image'),
  validateFileExists,
  uploadCategoryImage,
  handleFileUploadError
);
// #end-route

// #route DELETE /:id/image - Eliminar imagen de categoría
/**
 * Elimina la imagen de una categoría.
 * 
 * @route DELETE /api/categories/:id/image
 * @access Private
 */
categoriesRouter.delete(
  '/:id/image',
  validateJWTAndGetPayload,
  deleteCategoryImage
);
// #end-route

export default categoriesRouter;