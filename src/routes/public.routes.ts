/* backend/src/routes/public.routes.ts */
// #section Imports
import { Router } from "express";
import { validateBranchId, validateProductId } from "../middlewares/public/public.validations";
import { getBranchMenu, getBranchInfo, getProductDetail } from "../middlewares/public/public.middlewares";
// #end-section

// #variable publicRouter
export const publicRouter = Router();
// #end-variable

// #route GET /branches/:branchId/menu - Obtener menú de sucursal
/**
 * Obtiene categorías y productos de una sucursal.
 * Ruta pública (sin autenticación).
 * 
 * @route GET /api/public/branches/:branchId/menu
 * @access Public
 */
publicRouter.get(
  "/branches/:branchId/menu",
  validateBranchId,
  getBranchMenu
);
// #end-route

// #route GET /branches/:branchId/info - Obtener info de sucursal
/**
 * Obtiene información de la compañía, horarios y redes sociales.
 * Ruta pública (sin autenticación).
 * 
 * @route GET /api/public/branches/:branchId/info
 * @access Public
 */
publicRouter.get(
  "/branches/:branchId/info",
  validateBranchId,
  getBranchInfo
);
// #end-route

// #route GET /products/:productId - Obtener detalle de producto
/**
 * Obtiene el detalle completo de un producto.
 * Ruta pública (sin autenticación).
 * 
 * @route GET /api/public/products/:productId
 * @access Public
 */
publicRouter.get(
  "/products/:productId",
  validateProductId,
  getProductDetail
);
// #end-route