/* backend/src/routes/products.routes.ts */
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
import { 
  uploadSingleFile, 
  validateFileExists,
  handleFileUploadError 
} from "../middlewares/fileUpload/fileUpload.middleware";
import {
  validateProductId,
  validateCreateProductPayload,
  validateUpdateProductPayload,
  verifyProductOwnership,
  verifyCategoryOwnership
} from "../middlewares/products/products.validations";
import {
  createProduct,
  getCategoryProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  reorderProducts,
  uploadProductImages,
  deleteProductImage,
  reorderProductImages
} from "../middlewares/products/products.middlewares";
import multer from 'multer';
// #end-section

// #variable productsRouter
export const productsRouter = Router();
// #end-variable

// #config multer para múltiples archivos
const storage = multer.memoryStorage();
const uploadMultiple = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
}).array('images', 6); // Máximo 6 archivos
// #end-config

// #route POST / - Crear producto
/**
 * Crea un nuevo producto en una categoría.
 * 
 * @route POST /api/products
 * @access Private
 * 
 * Body: {
 *   categoryId: number,
 *   name: string,
 *   description?: string,
 *   basePrice: number,
 *   discount?: number,
 *   hasStockControl?: boolean,
 *   currentStock?: number,
 *   stockAlertThreshold?: number,
 *   stockStopThreshold?: number,
 *   isAvailable?: boolean
 * }
 */
productsRouter.post(
  "/",
  validateJWTAndGetPayload,
  validateCreateProductPayload,
  verifyCategoryOwnership,
  createProduct
);
// #end-route

// #route GET /category/:categoryId - Obtener productos de una categoría
/**
 * Obtiene todos los productos de una categoría.
 * 
 * @route GET /api/products/category/:categoryId
 * @access Private
 */
productsRouter.get(
  "/category/:categoryId",
  validateJWTAndGetPayload,
  getCategoryProducts
);
// #end-route

// #route GET /:id - Obtener producto por ID
/**
 * Obtiene un producto específico por su ID.
 * 
 * @route GET /api/products/:id
 * @access Private
 */
productsRouter.get(
  "/:id",
  validateJWTAndGetPayload,
  validateProductId,
  getProductById
);
// #end-route

// #route PUT /:id - Actualizar producto
/**
 * Actualiza un producto existente.
 * 
 * @route PUT /api/products/:id
 * @access Private
 * 
 * Body: {
 *   name?: string,
 *   description?: string,
 *   basePrice?: number,
 *   discount?: number,
 *   hasStockControl?: boolean,
 *   currentStock?: number,
 *   stockAlertThreshold?: number,
 *   stockStopThreshold?: number,
 *   isAvailable?: boolean
 * }
 */
productsRouter.put(
  "/:id",
  validateJWTAndGetPayload,
  validateProductId,
  verifyProductOwnership,
  validateUpdateProductPayload,
  updateProduct
);
// #end-route

// #route DELETE /:id - Eliminar producto
/**
 * Elimina un producto de forma permanente.
 * También elimina todas sus imágenes de Cloudinary.
 * 
 * @route DELETE /api/products/:id
 * @access Private
 */
productsRouter.delete(
  "/:id",
  validateJWTAndGetPayload,
  validateProductId,
  verifyProductOwnership,
  deleteProduct
);
// #end-route

// #route PATCH /reorder - Reordenar productos
/**
 * Actualiza el sortOrder de múltiples productos.
 * 
 * @route PATCH /api/products/reorder
 * @access Private
 * 
 * Body: {
 *   updates: Array<{ id: number, sortOrder: number }>
 * }
 */
productsRouter.patch(
  "/reorder",
  validateJWTAndGetPayload,
  reorderProducts
);
// #end-route

// #route POST /:id/images - Subir imágenes del producto
/**
 * Sube múltiples imágenes a un producto.
 * Máximo 6 imágenes totales.
 * 
 * @route POST /api/products/:id/images
 * @access Private
 */
productsRouter.post(
  '/:id/images',
  validateJWTAndGetPayload,
  validateProductId,
  verifyProductOwnership,
  uploadMultiple,
  uploadProductImages,
  handleFileUploadError
);
// #end-route

// #route DELETE /:id/images - Eliminar imagen del producto
/**
 * Elimina una imagen específica de un producto.
 * 
 * @route DELETE /api/products/:id/images
 * @access Private
 * 
 * Body: {
 *   imageUrl: string
 * }
 */
productsRouter.delete(
  '/:id/images',
  validateJWTAndGetPayload,
  validateProductId,
  verifyProductOwnership,
  deleteProductImage
);
// #end-route

// #route PATCH /:id/images/reorder - Reordenar imágenes del producto
/**
 * Reordena las imágenes de un producto.
 * La primera imagen será la imagen principal.
 * 
 * @route PATCH /api/products/:id/images/reorder
 * @access Private
 * 
 * Body: {
 *   images: string[]
 * }
 */
productsRouter.patch(
  '/:id/images/reorder',
  validateJWTAndGetPayload,
  validateProductId,
  verifyProductOwnership,
  reorderProductImages
);
// #end-route