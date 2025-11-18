/* src/routes/categories.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import {
  validateCategoryId,
  validateCreateCategoryPayload,
  validateUpdateCategoryPayload,
  verifyBranchOwnership,
  verifyCategoryOwnership,
  createCategory,
  getBranchCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
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

// #route POST / - Crear categoría
/**
 * Crea una nueva categoría para una sucursal.
 * 
 * @route POST /api/categories
 * @access Private
 * 
 * Body: {
 *   branchId: number,
 *   name: string,
 *   description?: string,
 *   imageUrl?: string,
 *   textColor?: string,
 *   backgroundMode?: 'solid' | 'gradient',
 *   backgroundColor?: string,
 *   gradient?: { type, angle, colors }
 * }
 */
categoriesRouter.post(
  "/",
  validateJWTAndGetPayload,
  validateCreateCategoryPayload,
  verifyBranchOwnership,
  createCategory
);
// #end-route

// #route GET /branch/:branchId - Listar categorías de una sucursal
/**
 * Obtiene todas las categorías de una sucursal.
 * Ordenadas por fecha de creación (más antigua primero).
 * 
 * @route GET /api/categories/branch/:branchId
 * @access Private
 */
categoriesRouter.get(
  "/branch/:branchId",
  validateJWTAndGetPayload,
  getBranchCategories
);
// #end-route

// #route GET /:id - Obtener una categoría
/**
 * Obtiene los datos de una categoría específica.
 * 
 * @route GET /api/categories/:id
 * @access Private
 */
categoriesRouter.get(
  "/:id",
  validateJWTAndGetPayload,
  validateCategoryId,
  verifyCategoryOwnership,
  getCategoryById
);
// #end-route

// #route PUT /:id - Actualizar categoría
/**
 * Actualiza los datos de una categoría.
 * 
 * @route PUT /api/categories/:id
 * @access Private
 * 
 * Body: {
 *   name?: string,
 *   description?: string,
 *   imageUrl?: string,
 *   textColor?: string,
 *   backgroundMode?: 'solid' | 'gradient',
 *   backgroundColor?: string,
 *   gradient?: { type, angle, colors }
 * }
 */
categoriesRouter.put(
  "/:id",
  validateJWTAndGetPayload,
  validateCategoryId,
  verifyCategoryOwnership,
  validateUpdateCategoryPayload,
  updateCategory
);
// #end-route

// #route DELETE /:id - Eliminar categoría (hard delete)
/**
 * Elimina una categoría de forma permanente.
 * También elimina su imagen de Cloudinary si existe.
 * 
 * @route DELETE /api/categories/:id
 * @access Private
 */
categoriesRouter.delete(
  "/:id",
  validateJWTAndGetPayload,
  validateCategoryId,
  verifyCategoryOwnership,
  deleteCategory
);
// #end-route

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