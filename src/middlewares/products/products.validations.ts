/* backend/src/middlewares/products/products.validations.ts */
// #section Imports
import { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { db } from '../../db/init';
import { productsTable, categoriesTable, branchesTable, companiesTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
// #end-section
// #middleware validateProductId
/**
 * Middleware: validateProductId
 * 
 * Valida que el ID de producto sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next middleware
 */
export const validateProductId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    if (isNaN(productId) || productId <= 0) {
      res.status(400).json({
        success: false,
        error: 'ID de producto inválido'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando productId:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar ID de producto'
    });
  }
};
// #end-middleware
// #middleware validateCreateProductPayload
/**
 * Middleware: validateCreateProductPayload
 * 
 * Valida el payload para crear un producto.
 * 
 * Required: categoryId, name, basePrice
 * Optional: description, discount, stock fields, isAvailable
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next middleware
 */
export const validateCreateProductPayload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      categoryId, 
      name, 
      description,
      basePrice,
      discount,
      hasStockControl,
      currentStock,
      stockAlertThreshold,
      stockStopThreshold,
      isAvailable
    } = req.body;

    // Validar campos requeridos
    if (!categoryId || !name || basePrice === undefined) {
      res.status(400).json({
        success: false,
        error: 'categoryId, name y basePrice son requeridos'
      });
      return;
    }

    // Validar tipos
    if (typeof categoryId !== 'number' || categoryId <= 0) {
      res.status(400).json({
        success: false,
        error: 'categoryId debe ser un número positivo'
      });
      return;
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'name debe ser un string no vacío'
      });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({
        success: false,
        error: 'name no puede exceder 100 caracteres'
      });
      return;
    }

    // Validar basePrice
    const price = Number(basePrice);
    if (isNaN(price) || price < 0) {
      res.status(400).json({
        success: false,
        error: 'basePrice debe ser un número positivo'
      });
      return;
    }

    // Validar discount si existe
    if (discount !== undefined && discount !== null) {
      const discountNum = Number(discount);
      if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
        res.status(400).json({
          success: false,
          error: 'discount debe ser un número entre 0 y 100'
        });
        return;
      }
    }

    // Validar description si existe
    if (description && typeof description !== 'string') {
      res.status(400).json({
        success: false,
        error: 'description debe ser un string'
      });
      return;
    }

    if (description && description.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'description no puede exceder 1000 caracteres'
      });
      return;
    }

    // Validar campos de stock si hasStockControl está activo
    if (hasStockControl === true) {
      if (currentStock === undefined || currentStock === null) {
        res.status(400).json({
          success: false,
          error: 'currentStock es requerido cuando hasStockControl es true'
        });
        return;
      }

      if (typeof currentStock !== 'number' || currentStock < 0) {
        res.status(400).json({
          success: false,
          error: 'currentStock debe ser un número positivo'
        });
        return;
      }

      // Validar umbrales si existen
      if (stockAlertThreshold !== undefined && stockAlertThreshold !== null) {
        if (typeof stockAlertThreshold !== 'number' || stockAlertThreshold < 0) {
          res.status(400).json({
            success: false,
            error: 'stockAlertThreshold debe ser un número positivo'
          });
          return;
        }
      }

      if (stockStopThreshold !== undefined && stockStopThreshold !== null) {
        if (typeof stockStopThreshold !== 'number' || stockStopThreshold < 0) {
          res.status(400).json({
            success: false,
            error: 'stockStopThreshold debe ser un número positivo'
          });
          return;
        }
      }
    }

    // Validar isAvailable si existe
    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'isAvailable debe ser un boolean'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando payload de creación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar payload'
    });
  }
};
// #end-middleware
// #middleware validateUpdateProductPayload
/**
 * Middleware: validateUpdateProductPayload
 * 
 * Valida el payload para actualizar un producto.
 * Todos los campos son opcionales.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next middleware
 */
export const validateUpdateProductPayload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      name, 
      description,
      basePrice,
      discount,
      hasStockControl,
      currentStock,
      stockAlertThreshold,
      stockStopThreshold,
      isAvailable
    } = req.body;

    // Validar name si existe
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'name debe ser un string no vacío'
        });
        return;
      }

      if (name.trim().length > 100) {
        res.status(400).json({
          success: false,
          error: 'name no puede exceder 100 caracteres'
        });
        return;
      }
    }

    // Validar description si existe
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        res.status(400).json({
          success: false,
          error: 'description debe ser un string'
        });
        return;
      }

      if (description.length > 1000) {
        res.status(400).json({
          success: false,
          error: 'description no puede exceder 1000 caracteres'
        });
        return;
      }
    }

    // Validar basePrice si existe
    if (basePrice !== undefined) {
      const price = Number(basePrice);
      if (isNaN(price) || price < 0) {
        res.status(400).json({
          success: false,
          error: 'basePrice debe ser un número positivo'
        });
        return;
      }
    }

    // Validar discount si existe
    if (discount !== undefined && discount !== null) {
      const discountNum = Number(discount);
      if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
        res.status(400).json({
          success: false,
          error: 'discount debe ser un número entre 0 y 100'
        });
        return;
      }
    }

    // Validar campos de stock
    if (currentStock !== undefined && currentStock !== null) {
      if (typeof currentStock !== 'number' || currentStock < 0) {
        res.status(400).json({
          success: false,
          error: 'currentStock debe ser un número positivo'
        });
        return;
      }
    }

    if (stockAlertThreshold !== undefined && stockAlertThreshold !== null) {
      if (typeof stockAlertThreshold !== 'number' || stockAlertThreshold < 0) {
        res.status(400).json({
          success: false,
          error: 'stockAlertThreshold debe ser un número positivo'
        });
        return;
      }
    }

    if (stockStopThreshold !== undefined && stockStopThreshold !== null) {
      if (typeof stockStopThreshold !== 'number' || stockStopThreshold < 0) {
        res.status(400).json({
          success: false,
          error: 'stockStopThreshold debe ser un número positivo'
        });
        return;
      }
    }

    // Validar booleans
    if (hasStockControl !== undefined && typeof hasStockControl !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'hasStockControl debe ser un boolean'
      });
      return;
    }

    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'isAvailable debe ser un boolean'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando payload de actualización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar payload'
    });
  }
};
// #end-middleware
// #middleware verifyProductOwnership
/**
 * Middleware: verifyProductOwnership
 * 
 * Verifica que el usuario autenticado sea dueño del producto.
 * Para ello, verifica la cadena: Product → Category → Branch → Company → User
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next middleware
 */
export const verifyProductOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const productId = Number(req.params.id);

    // Obtener producto con toda la cadena de relaciones
    const product = await db
      .select({
        productId: productsTable.id,
        categoryId: categoriesTable.id,
        branchId: branchesTable.id,
        companyId: companiesTable.id,
        ownerId: companiesTable.ownerId
      })
      .from(productsTable)
      .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .innerJoin(branchesTable, eq(categoriesTable.branchId, branchesTable.id))
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (product.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Verificar ownership
    if (product[0].ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar este producto'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware
// #middleware verifyCategoryOwnership
/**
 * Middleware: verifyCategoryOwnership
 * 
 * Verifica que el usuario sea dueño de la categoría especificada en el body.
 * Usado al crear un producto.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Next middleware
 */
export const verifyCategoryOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { categoryId } = req.body;

    // Obtener categoría con toda la cadena de relaciones
    const category = await db
      .select({
        categoryId: categoriesTable.id,
        branchId: branchesTable.id,
        companyId: companiesTable.id,
        ownerId: companiesTable.ownerId
      })
      .from(categoriesTable)
      .innerJoin(branchesTable, eq(categoriesTable.branchId, branchesTable.id))
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(eq(categoriesTable.id, Number(categoryId)))
      .limit(1);

    if (category.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
      return;
    }

    // Verificar ownership
    if (category[0].ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'No tienes permiso para crear productos en esta categoría'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware