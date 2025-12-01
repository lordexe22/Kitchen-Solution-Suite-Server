/* src/middlewares/categories/categories.export.middleware.ts */

// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { categoriesTable, productsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { generateCategoryExcel } from "../../utils/excelHelpers";
// #end-section

// #middleware exportCategory
/**
 * Middleware: exportCategory
 * 
 * Exporta una categoría con todos sus productos a un archivo Excel.
 * 
 * Flujo:
 * 1. Obtener categoría (ya validada por verifyCategoryOwnership)
 * 2. Obtener todos los productos de la categoría
 * 3. Generar archivo Excel con 2 hojas (Categoría + Productos)
 * 4. Retornar archivo como download
 * 
 * @route GET /api/categories/:id/export
 * @access Private (requiere autenticación y ownership)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y categoryId en params
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const exportCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categoryId = parseInt(req.params.id);

    // ========================================
    // 1. Obtener categoría
    // ========================================
    
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
      });
      return;
    }

    // ========================================
    // 2. Obtener productos de la categoría
    // ========================================
    
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.categoryId, categoryId))
      .orderBy(productsTable.sortOrder);

    if (products.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No se puede exportar una categoría sin productos',
      });
      return;
    }

    // ========================================
    // 3. Generar archivo Excel
    // ========================================
    
    const excelBuffer = generateCategoryExcel(category, products);

    // ========================================
    // 4. Retornar archivo como download
    // ========================================
    
    // Sanitizar nombre de archivo (remover caracteres especiales)
    const sanitizedName = category.name
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .toLowerCase();

    const filename = `categoria-${sanitizedName}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error in exportCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar la categoría',
    });
  }
};
// #end-middleware