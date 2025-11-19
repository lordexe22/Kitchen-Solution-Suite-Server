/* src/middlewares/categories/categories.middlewares.ts */
// #section Imports
import { Response } from "express";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { uploadFile, deleteFile, loadConfig, NotFoundError } from '../../modules/cloudinary';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary-folders.config';
import { db } from '../../db/init';
import { categoriesTable } from '../../db/schema';
import { branchesTable, companiesTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
// #end-section

// #middleware validateCategoryId
/**
 * Middleware: validateCategoryId
 * 
 * Valida que el ID de categoría sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Next middleware
 */
export const validateCategoryId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);

    if (isNaN(categoryId) || categoryId <= 0) {
      res.status(400).json({
        success: false,
        error: 'ID de categoría inválido'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando categoryId:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar ID de categoría'
    });
  }
};
// #end-middleware

// #middleware validateCreateCategoryPayload
/**
 * Middleware: validateCreateCategoryPayload
 * 
 * Valida el payload para crear una categoría.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Next middleware
 */
export const validateCreateCategoryPayload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const {
      branchId,
      name,
      description,
      imageUrl,
      textColor,
      backgroundMode,
      backgroundColor,
      gradient
    } = req.body;

    // Validar branchId
    if (!branchId || isNaN(Number(branchId))) {
      res.status(400).json({
        success: false,
        error: 'branchId es obligatorio y debe ser un número'
      });
      return;
    }

    // Validar name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'El nombre es obligatorio'
      });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        success: false,
        error: 'El nombre no puede superar 100 caracteres'
      });
      return;
    }

    // Validar description (opcional)
    if (description && description.length > 500) {
      res.status(400).json({
        success: false,
        error: 'La descripción no puede superar 500 caracteres'
      });
      return;
    }

    // Validar textColor (hex color)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (textColor && !hexColorRegex.test(textColor)) {
      res.status(400).json({
        success: false,
        error: 'El color de texto debe ser un código hexadecimal válido (ej: #FFFFFF)'
      });
      return;
    }

    // Validar backgroundMode
    if (backgroundMode && !['solid', 'gradient'].includes(backgroundMode)) {
      res.status(400).json({
        success: false,
        error: 'El modo de fondo debe ser "solid" o "gradient"'
      });
      return;
    }

    // Validar backgroundColor (hex color)
    if (backgroundColor && !hexColorRegex.test(backgroundColor)) {
      res.status(400).json({
        success: false,
        error: 'El color de fondo debe ser un código hexadecimal válido (ej: #3B82F6)'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando payload de categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar datos de categoría'
    });
  }
};
// #end-middleware

// #middleware validateUpdateCategoryPayload
/**
 * Middleware: validateUpdateCategoryPayload
 * 
 * Valida el payload para actualizar una categoría.
 * Los campos son opcionales pero deben ser válidos si se envían.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Next middleware
 */
export const validateUpdateCategoryPayload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const {
      name,
      description,
      imageUrl,
      textColor,
      backgroundMode,
      backgroundColor,
      gradient
    } = req.body;

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    // Validar name (opcional, pero si viene debe ser válido)
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El nombre no puede estar vacío'
        });
        return;
      }
      if (name.length > 100) {
        res.status(400).json({
          success: false,
          error: 'El nombre no puede superar 100 caracteres'
        });
        return;
      }
    }

    // Validar description (opcional)
    if (description !== undefined && description && description.length > 500) {
      res.status(400).json({
        success: false,
        error: 'La descripción no puede superar 500 caracteres'
      });
      return;
    }

    // Validar textColor (opcional)
    if (textColor !== undefined && !hexColorRegex.test(textColor)) {
      res.status(400).json({
        success: false,
        error: 'El color de texto debe ser un código hexadecimal válido (ej: #FFFFFF)'
      });
      return;
    }

    // Validar backgroundMode (opcional)
    if (backgroundMode !== undefined && !['solid', 'gradient'].includes(backgroundMode)) {
      res.status(400).json({
        success: false,
        error: 'El modo de fondo debe ser "solid" o "gradient"'
      });
      return;
    }

    // Validar backgroundColor (opcional)
    if (backgroundColor !== undefined && !hexColorRegex.test(backgroundColor)) {
      res.status(400).json({
        success: false,
        error: 'El color de fondo debe ser un código hexadecimal válido (ej: #3B82F6)'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validando payload de actualización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar datos de actualización'
    });
  }
};
// #end-middleware

// #middleware verifyBranchOwnership
/**
 * Middleware: verifyBranchOwnership
 * 
 * Verifica que el usuario sea dueño de la compañía de la sucursal.
 * Se usa antes de crear/modificar categorías.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Next middleware
 */
export const verifyBranchOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const branchId = Number(req.body.branchId || req.params.branchId);
    const userId = req.user!.userId;

    // Verificar que la sucursal existe y pertenece a una compañía del usuario
    const [branch] = await db
      .select()
      .from(branchesTable)
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(companiesTable.ownerId, userId),
          eq(branchesTable.isActive, true),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (!branch) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta sucursal'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de sucursal:', error);
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
 * Verifica que la categoría pertenezca a una sucursal del usuario.
 * Se usa antes de actualizar/eliminar categorías.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {Function} next - Next middleware
 */
export const verifyCategoryOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: Function
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);
    const userId = req.user!.userId;

    // Verificar que la categoría existe y pertenece a una sucursal del usuario
    const [category] = await db
      .select()
      .from(categoriesTable)
      .innerJoin(branchesTable, eq(categoriesTable.branchId, branchesTable.id))
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(
        and(
          eq(categoriesTable.id, categoryId),
          eq(companiesTable.ownerId, userId),
          eq(branchesTable.isActive, true),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (!category) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta categoría'
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

// #middleware createCategory
/**
 * Middleware: createCategory
 * 
 * Crea una nueva categoría para una sucursal.
 * Automáticamente asigna sortOrder como el máximo + 1 de la sucursal.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateCreateCategoryPayload
 * - verifyBranchOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      branchId,
      name,
      description,
      imageUrl,
      textColor,
      backgroundMode,
      backgroundColor,
      gradient
    } = req.body;

    // Preparar gradientConfig como JSON string si existe
    let gradientConfigString = null;
    if (gradient && backgroundMode === 'gradient') {
      gradientConfigString = JSON.stringify(gradient);
    }

    // Obtener el sortOrder máximo actual de la sucursal
    const maxSortOrderResult = await db
      .select({ maxOrder: categoriesTable.sortOrder })
      .from(categoriesTable)
      .where(eq(categoriesTable.branchId, Number(branchId)))
      .orderBy(categoriesTable.sortOrder)
      .limit(1);

    // Calcular el nuevo sortOrder (máximo + 1, o 1 si no hay categorías)
    const nextSortOrder = maxSortOrderResult.length > 0 
      ? (maxSortOrderResult[0].maxOrder || 0) + 1 
      : 1;

    // Crear la categoría
    const [newCategory] = await db
      .insert(categoriesTable)
      .values({
        branchId: Number(branchId),
        name: name.trim(),
        description: description || null,
        imageUrl: imageUrl || null,
        textColor: textColor || '#FFFFFF',
        backgroundMode: backgroundMode || 'solid',
        backgroundColor: backgroundColor || '#3B82F6',
        gradientConfig: gradientConfigString,
        sortOrder: nextSortOrder
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        category: newCategory
      }
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la categoría'
    });
  }
};
// #end-middleware

// #middleware getBranchCategories
/**
 * Middleware: getBranchCategories
 * 
 * Obtiene todas las categorías de una sucursal.
 * Ordenadas por sortOrder ASC (menor primero).
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getBranchCategories = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.branchId);

    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.branchId, branchId))
      .orderBy(categoriesTable.sortOrder); // ← CAMBIO AQUÍ

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las categorías'
    });
  }
};
// #end-middleware
// #middleware getCategoryById
/**
 * Middleware: getCategoryById
 * 
 * Obtiene una categoría específica por ID.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateCategoryId
 * - verifyCategoryOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getCategoryById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la categoría'
    });
  }
};
// #end-middleware

// #middleware updateCategory
/**
 * Middleware: updateCategory
 * 
 * Actualiza una categoría existente.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateCategoryId
 * - verifyCategoryOwnership
 * - validateUpdateCategoryPayload
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);
    const updates = req.body;

    // Si se actualiza el gradiente, convertir a JSON string
    if (updates.gradient) {
      updates.gradientConfig = JSON.stringify(updates.gradient);
      delete updates.gradient;
    }

    // Actualizar la categoría
    const [updatedCategory] = await db
      .update(categoriesTable)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(categoriesTable.id, categoryId))
      .returning();

    if (!updatedCategory) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la categoría'
    });
  }
};
// #end-middleware

// #middleware deleteCategory
/**
 * Middleware: deleteCategory
 * 
 * Elimina una categoría (hard delete).
 * También elimina su imagen de Cloudinary si existe.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateCategoryId
 * - verifyCategoryOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);

    // Obtener la categoría para verificar si tiene imagen
    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
      return;
    }

    // Si tiene imagen, eliminarla de Cloudinary
    if (category.imageUrl) {
      try {
        const config = loadConfig();
        const rootFolder = config.rootFolder;
        const { folder, publicId } = CLOUDINARY_FOLDERS.categories.images(
          categoryId,
          rootFolder
        );
        const fullPublicId = `${folder}/${publicId}`;
        await deleteFile(fullPublicId, { resourceType: 'image' });
      } catch (error) {
        console.log(`No se pudo eliminar imagen de categoría ${categoryId}, continuando...`);
      }
    }

    // Eliminar la categoría de la base de datos
    await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, categoryId));

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la categoría'
    });
  }
};
// #end-middleware

// #middleware uploadCategoryImage
/**
 * Middleware: uploadCategoryImage
 * 
 * Sube o actualiza la imagen de una categoría en Cloudinary.
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * - uploadSingleFile('image') (para obtener req.file)
 * - validateFileExists (para verificar que existe archivo)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y file
 * @param {Response} res - Response de Express
 */
export const uploadCategoryImage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);

    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category ID',
      });
      return;
    }

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir folder y publicId usando helper
    const { folder, publicId } = CLOUDINARY_FOLDERS.categories.images(
      categoryId,
      rootFolder
    );

    // Subir archivo a Cloudinary
    const uploadResult = await uploadFile(req.file!.buffer, {
      folder,
      publicId,
      overwrite: true,
      resourceType: 'image',
      tags: ['category-image', `category-${categoryId}`],
    });

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully',
      data: {
        categoryId,
        imageUrl: uploadResult.secureUrl,
        cloudinary: {
          publicId: uploadResult.publicId,
          url: uploadResult.secureUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Error uploading category image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload category image',
      details: error.message,
    });
  }
};
// #end-middleware

// #middleware deleteCategoryImage
/**
 * Middleware: deleteCategoryImage
 * 
 * Elimina la imagen de una categoría de Cloudinary.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteCategoryImage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.id);

    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category ID',
      });
      return;
    }

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir publicId completo
    const { folder, publicId } = CLOUDINARY_FOLDERS.categories.images(
      categoryId,
      rootFolder
    );
    const fullPublicId = `${folder}/${publicId}`;

    // Intentar eliminar de Cloudinary
    try {
      await deleteFile(fullPublicId, {
        resourceType: 'image',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.log(`Image for category ${categoryId} not found in Cloudinary, continuing...`);
      } else {
        throw error;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Category image deleted successfully',
      data: {
        categoryId,
        imageUrl: null,
      },
    });
  } catch (error: any) {
    console.error('Error deleting category image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category image',
      details: error.message,
    });
  }
};
// #end-middleware

// #middleware reorderCategories
/**
 * Middleware: reorderCategories
 * 
 * Actualiza el sortOrder de múltiples categorías en una transacción.
 * Recibe un array de { id, sortOrder } y actualiza todas en batch.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - Body: { updates: Array<{ id: number, sortOrder: number }> }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const reorderCategories = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { updates } = req.body;
    const userId = req.user?.userId;

    // Validar que existe userId
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    // Validar payload
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un array de actualizaciones'
      });
      return;
    }

    // Validar estructura de cada update
    for (const update of updates) {
      if (!update.id || typeof update.sortOrder !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Cada actualización debe tener id y sortOrder válidos'
        });
        return;
      }
    }

    // Obtener el primer categoryId para verificar la branch
    const firstCategoryId = updates[0].id;
    
    const categoryResult = await db
      .select({
        id: categoriesTable.id,
        branchId: categoriesTable.branchId
      })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, firstCategoryId))
      .limit(1);

    if (categoryResult.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
      return;
    }

    const branchId = categoryResult[0].branchId;

    // Verificar ownership de la branch
    const branchResult = await db
      .select({
        id: branchesTable.id,
        companyId: branchesTable.companyId
      })
      .from(branchesTable)
      .where(eq(branchesTable.id, branchId))
      .limit(1);

    if (branchResult.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Sucursal no encontrada'
      });
      return;
    }

    const companyResult = await db
      .select({
        ownerId: companiesTable.ownerId
      })
      .from(companiesTable)
      .where(eq(companiesTable.id, branchResult[0].companyId))
      .limit(1);

    if (companyResult.length === 0 || companyResult[0].ownerId !== userId) {
      res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar estas categorías'
      });
      return;
    }

    // Actualizar sortOrder de todas las categorías
    for (const update of updates) {
      await db
        .update(categoriesTable)
        .set({ 
          sortOrder: update.sortOrder,
          updatedAt: new Date()
        })
        .where(eq(categoriesTable.id, update.id));
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Orden actualizado correctamente'
      }
    });
  } catch (error) {
    console.error('Error reordenando categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reordenar categorías'
    });
  }
};
// #end-middleware
