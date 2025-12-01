/* src/middlewares/categories/categories.import.middleware.ts */

// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { categoriesTable, productsTable } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { parseCategoryExcel } from "../../utils/excelHelpers";
import type { ParsedCategoryData, ParsedProductData } from "../../utils/excelHelpers";
// #end-section

// #middleware validateImportPayload
/**
 * Middleware: validateImportPayload
 * 
 * Valida que el payload de importación contenga:
 * - branchId: número válido
 * - file: archivo Excel en req.file (subido por multer)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateImportPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { branchId } = req.body;

  // Validar branchId
  if (!branchId || isNaN(parseInt(branchId))) {
    res.status(400).json({
      success: false,
      error: 'El ID de la sucursal es obligatorio y debe ser un número',
    });
    return;
  }

  // Validar que exista el archivo
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'Debe subir un archivo Excel (.xlsx)',
    });
    return;
  }

  // Validar extensión del archivo
  const filename = req.file.originalname.toLowerCase();
  if (!filename.endsWith('.xlsx')) {
    res.status(400).json({
      success: false,
      error: 'El archivo debe ser de tipo Excel (.xlsx)',
    });
    return;
  }

  // Normalizar branchId
  req.body.branchId = parseInt(branchId);

  next();
};
// #end-middleware

// #function generateUniqueCategoryName
/**
 * Genera un nombre único para la categoría si ya existe en la sucursal.
 * 
 * Si existe "Pizzas" → "Pizzas (Copia)"
 * Si existe "Pizzas (Copia)" → "Pizzas (Copia 2)"
 * Y así sucesivamente.
 * 
 * @param baseName - Nombre original de la categoría
 * @param branchId - ID de la sucursal destino
 * @returns Nombre único que no existe en la sucursal
 */
async function generateUniqueCategoryName(
  baseName: string,
  branchId: number
): Promise<string> {
  let finalName = baseName;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Buscar si existe una categoría con ese nombre en la sucursal
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.branchId, branchId),
          eq(categoriesTable.name, finalName)
        )
      )
      .limit(1);

    // Si no existe, retornar el nombre
    if (!existing) {
      return finalName;
    }

    // Si existe, generar nuevo nombre
    finalName = counter === 1 
      ? `${baseName} (Copia)` 
      : `${baseName} (Copia ${counter})`;
    
    counter++;
  }
}
// #end-function

// #function getNextSortOrder
/**
 * Obtiene el siguiente sortOrder disponible para una nueva categoría.
 * Calcula: max(sortOrder) + 1
 * 
 * @param branchId - ID de la sucursal
 * @returns Siguiente sortOrder disponible
 */
async function getNextSortOrder(branchId: number): Promise<number> {
  const [result] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.branchId, branchId))
    .orderBy(desc(categoriesTable.sortOrder))
    .limit(1);

  return result ? result.sortOrder + 1 : 0;
}
// #end-function

// #middleware importCategory
/**
 * Middleware: importCategory
 * 
 * Importa una categoría con sus productos desde un archivo Excel.
 * 
 * Flujo:
 * 1. Parsear archivo Excel
 * 2. Validar estructura y datos
 * 3. Generar nombre único si existe conflicto
 * 4. Calcular sortOrder (agregar al final)
 * 5. Crear categoría
 * 6. Crear productos asociados
 * 7. Retornar resumen
 * 
 * @route POST /api/categories/import
 * @access Private (requiere autenticación y ownership de sucursal)
 * 
 * Body (multipart/form-data):
 * - branchId: number
 * - file: Excel file (.xlsx)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y archivo
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const importCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchId = req.body.branchId;
    const fileBuffer = req.file!.buffer;

    // ========================================
    // 1. Parsear archivo Excel
    // ========================================
    
    let parsedData: {
      category: ParsedCategoryData;
      products: ParsedProductData[];
    };

    try {
      parsedData = parseCategoryExcel(fileBuffer);
    } catch (parseError) {
      res.status(400).json({
        success: false,
        error: `Error al parsear Excel: ${(parseError as Error).message}`,
      });
      return;
    }

    const { category: categoryData, products: productsData } = parsedData;

    // ========================================
    // 2. Generar nombre único
    // ========================================
    
    const uniqueName = await generateUniqueCategoryName(
      categoryData.name,
      branchId
    );

    // ========================================
    // 3. Calcular sortOrder (agregar al final)
    // ========================================
    
    const sortOrder = await getNextSortOrder(branchId);

    // ========================================
    // 4. Crear categoría
    // ========================================
    
    const [newCategory] = await db
      .insert(categoriesTable)
      .values({
        branchId,
        name: uniqueName,
        description: categoryData.description,
        imageUrl: categoryData.imageUrl,
        textColor: categoryData.textColor,
        backgroundMode: categoryData.backgroundMode,
        backgroundColor: categoryData.backgroundColor,
        gradientConfig: categoryData.gradientConfig,
        sortOrder,
      })
      .returning();

    // ========================================
    // 5. Crear productos asociados
    // ========================================
    
    const newProducts = await db
      .insert(productsTable)
      .values(
        productsData.map((product, index) => ({
          categoryId: newCategory.id,
          name: product.name,
          description: product.description,
          images: product.images,
          tags: product.tags,
          basePrice: product.basePrice.toString(), // DB espera string
          discount: product.discount?.toString() || null,
          hasStockControl: product.hasStockControl,
          currentStock: product.currentStock,
          stockAlertThreshold: product.stockAlertThreshold,
          stockStopThreshold: product.stockStopThreshold,
          isAvailable: product.isAvailable,
          sortOrder: index, // Resetear sortOrder (0, 1, 2, ...)
        }))
      )
      .returning();

    // ========================================
    // 6. Retornar resumen
    // ========================================
    
    res.status(201).json({
      success: true,
      data: {
        category: newCategory,
        products: newProducts,
        summary: {
          categoryName: newCategory.name,
          originalName: categoryData.name,
          wasRenamed: uniqueName !== categoryData.name,
          productsImported: newProducts.length,
        },
      },
    });

  } catch (error) {
    console.error('Error in importCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Error al importar la categoría',
    });
  }
};
// #end-middleware