/* backend/src/middlewares/public/public.middlewares.ts */
// #section Imports
import type { Request, Response } from "express";
import { db } from "../../db/init";
import { 
  branchesTable, 
  companiesTable, 
  categoriesTable, 
  productsTable,
  branchSchedulesTable,
  branchSocialsTable
} from "../../db/schema";
import { eq, and } from "drizzle-orm";
// #end-section
// #middleware getBranchMenu
/**
 * Obtiene el menú completo de una sucursal (categorías + productos).
 * No requiere autenticación.
 * 
 * @route GET /api/public/branches/:branchId/menu
 */
export const getBranchMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);

    // 1. Verificar que la sucursal existe y está activa
    const branch = await db
      .select()
      .from(branchesTable)
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(branchesTable.isActive, true)
        )
      )
      .limit(1);

    if (branch.length === 0) {
      res.status(404).json({
        success: false,
        message: "Sucursal no encontrada o inactiva"
      });
      return;
    }

    // 2. Obtener todas las categorías de la sucursal
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.branchId, branchId))
      .orderBy(categoriesTable.sortOrder);

    // 3. Obtener todos los productos de todas las categorías
    const categoryIds = categories.map((c: typeof categoriesTable.$inferSelect) => c.id);
    
    const allProducts: (typeof productsTable.$inferSelect)[] = [];
    
    if (categoryIds.length > 0) {
      // Hacer una query por cada categoría
      for (const categoryId of categoryIds) {
        const categoryProducts = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.categoryId, categoryId))
          .orderBy(productsTable.sortOrder);
        allProducts.push(...categoryProducts);
      }
    }

    // 4. Organizar productos por categoría
    const categoriesWithProducts = categories.map((category: typeof categoriesTable.$inferSelect) => {
      const categoryProducts = allProducts
        .filter((p) => p.categoryId === category.id)
        // Separar productos disponibles y no disponibles
        .sort((a, b) => {
          // Primero los disponibles, luego los no disponibles
          if (a.isAvailable && !b.isAvailable) return -1;
          if (!a.isAvailable && b.isAvailable) return 1;
          
          // Si ambos tienen el mismo estado, mantener sortOrder
          return a.sortOrder - b.sortOrder;
        });

      return {
        ...category,
        products: categoryProducts
      };
    });

    res.status(200).json({
      success: true,
      data: {
        branch: branch[0],
        categories: categoriesWithProducts
      }
    });

  } catch (error) {
    console.error("Error fetching branch menu:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el menú"
    });
  }
};
// #end-middleware
// #middleware getBranchInfo
/**
 * Obtiene información de la compañía y sucursal (horarios, redes sociales).
 * No requiere autenticación.
 * 
 * @route GET /api/public/branches/:branchId/info
 */
export const getBranchInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);

    // 1. Obtener sucursal con información de compañía
    const branchWithCompany = await db
      .select({
        branch: branchesTable,
        company: companiesTable
      })
      .from(branchesTable)
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(branchesTable.isActive, true),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (branchWithCompany.length === 0) {
      res.status(404).json({
        success: false,
        message: "Sucursal no encontrada"
      });
      return;
    }

    // 2. Obtener horarios de la sucursal
    const schedules = await db
      .select()
      .from(branchSchedulesTable)
      .where(eq(branchSchedulesTable.branchId, branchId));

    // 3. Obtener redes sociales de la sucursal
    const socials = await db
      .select()
      .from(branchSocialsTable)
      .where(eq(branchSocialsTable.branchId, branchId));

    res.status(200).json({
      success: true,
      data: {
        branch: branchWithCompany[0].branch,
        company: branchWithCompany[0].company,
        schedules,
        socials
      }
    });

  } catch (error) {
    console.error("Error fetching branch info:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener información de la sucursal"
    });
  }
};
// #end-middleware
// #middleware getProductDetail
/**
 * Obtiene el detalle completo de un producto.
 * No requiere autenticación.
 * 
 * @route GET /api/public/products/:productId
 */
export const getProductDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.productId);

    // 1. Obtener producto con información de categoría y sucursal
    const productWithCategory = await db
      .select({
        product: productsTable,
        category: categoriesTable,
        branch: branchesTable
      })
      .from(productsTable)
      .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .innerJoin(branchesTable, eq(categoriesTable.branchId, branchesTable.id))
      .where(
        and(
          eq(productsTable.id, productId),
          eq(branchesTable.isActive, true)
        )
      )
      .limit(1);

    if (productWithCategory.length === 0) {
      res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: productWithCategory[0]
    });

  } catch (error) {
    console.error("Error fetching product detail:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle del producto"
    });
  }
};
// #end-middleware