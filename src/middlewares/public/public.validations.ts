/* backend/src/middlewares/public/public.validations.ts */
// #section Imports
import type { Request, Response, NextFunction } from "express";
// #end-section

// #middleware validateBranchId
/**
 * Valida que el branchId sea un número válido.
 */
export const validateBranchId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const branchId = Number(req.params.branchId);

  if (isNaN(branchId) || branchId <= 0) {
    res.status(400).json({
      success: false,
      message: "ID de sucursal inválido"
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware validateProductId
/**
 * Valida que el productId sea un número válido.
 */
export const validateProductId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const productId = Number(req.params.productId);

  if (isNaN(productId) || productId <= 0) {
    res.status(400).json({
      success: false,
      message: "ID de producto inválido"
    });
    return;
  }

  next();
};
// #end-middleware