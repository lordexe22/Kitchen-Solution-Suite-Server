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
  reorderCategories,
} from "../middlewares/categories/categories.middlewares";
import { 
  uploadSingleFile,
  uploadExcelFile,
  handleFileUploadError,
  validateFileExists,
} from "../middlewares/fileUpload/fileUpload.middleware";
import { exportCategory } from "../middlewares/categories/categories.export.middleware";
import { 
  importCategory,
  validateImportPayload,
} from "../middlewares/categories/categories.import.middleware";
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

// #route PATCH /reorder - Reordenar categorías
/**
 * Actualiza el sortOrder de múltiples categorías.
 * 
 * @route PATCH /api/categories/reorder
 * @access Private
 * 
 * Body: {
 *   updates: Array<{ id: number, sortOrder: number }>
 * }
 */
categoriesRouter.patch(
  "/reorder",
  validateJWTAndGetPayload,
  reorderCategories
);
// #end-route

// #route GET /:id/export - Exportar categoría a Excel
/**
 * Exporta una categoría con todos sus productos a un archivo Excel.
 * El archivo contiene 2 hojas: Categoría y Productos.
 * 
 * @route GET /api/categories/:id/export
 * @access Private
 * 
 * @returns Archivo Excel (.xlsx) para descargar
 */
categoriesRouter.get(
  "/:id/export",
  validateJWTAndGetPayload,
  validateCategoryId,
  verifyCategoryOwnership,
  exportCategory
);
// #end-route

// #route POST /import - Importar categoría desde Excel
/**
 * Importa una categoría con sus productos desde un archivo Excel.
 * Crea una nueva categoría en la sucursal destino.
 * Si el nombre existe, lo renombra automáticamente (ej: "Pizzas (Copia)").
 * 
 * @route POST /api/categories/import
 * @access Private
 * 
 * Body (multipart/form-data): {
 *   branchId: number,
 *   file: Excel file (.xlsx)
 * }
 */
categoriesRouter.post(
  "/import",
  validateJWTAndGetPayload,
  uploadExcelFile('file'),  // ← CAMBIADO: usar uploadExcelFile en vez de uploadSingleFile
  validateImportPayload,
  verifyBranchOwnership,
  importCategory,
  handleFileUploadError
);
// #end-route

export default categoriesRouter;