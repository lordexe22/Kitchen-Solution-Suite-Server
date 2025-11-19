/* backend/src/middlewares/products/products.middlewares.ts */
// #section Imports
import { Response } from "express";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { uploadFile, deleteFile, loadConfig, NotFoundError } from '../../modules/cloudinary';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary-folders.config';
import { db } from '../../db/init';
import { productsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
// #end-section

// #middleware createProduct
/**
 * Middleware: createProduct
 * 
 * Crea un nuevo producto.
 * Automáticamente asigna sortOrder como el máximo + 1 de la categoría.
 * Si hasStockControl es true y currentStock <= stockStopThreshold, isAvailable se pone en false.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateCreateProductPayload
 * - verifyCategoryOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
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

    // Obtener el sortOrder máximo actual de la categoría
    const maxSortOrderResult = await db
      .select({ maxOrder: productsTable.sortOrder })
      .from(productsTable)
      .where(eq(productsTable.categoryId, Number(categoryId)))
      .orderBy(productsTable.sortOrder)
      .limit(1);

    // Calcular el nuevo sortOrder (máximo + 1, o 1 si no hay productos)
    const nextSortOrder = maxSortOrderResult.length > 0 
      ? (maxSortOrderResult[0].maxOrder || 0) + 1 
      : 1;

    // Determinar isAvailable automáticamente si hay control de stock
    let finalIsAvailable = isAvailable !== undefined ? isAvailable : true;
    
    if (hasStockControl === true && stockStopThreshold !== undefined && stockStopThreshold !== null) {
      const stock = currentStock || 0;
      if (stock <= stockStopThreshold) {
        finalIsAvailable = false;
      }
    }

    // Crear el producto
    const [newProduct] = await db
      .insert(productsTable)
      .values({
        categoryId: Number(categoryId),
        name: name.trim(),
        description: description || null,
        basePrice: String(basePrice),
        discount: discount !== undefined ? String(discount) : null,
        hasStockControl: hasStockControl || false,
        currentStock: currentStock || null,
        stockAlertThreshold: stockAlertThreshold || null,
        stockStopThreshold: stockStopThreshold || null,
        isAvailable: finalIsAvailable,
        sortOrder: nextSortOrder,
        images: null // Se agregarán después con endpoint separado
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        product: newProduct
      }
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el producto'
    });
  }
};
// #end-middleware

// #middleware getCategoryProducts
/**
 * Middleware: getCategoryProducts
 * 
 * Obtiene todos los productos de una categoría.
 * Ordenados por sortOrder ASC (menor primero).
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getCategoryProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        error: 'categoryId inválido'
      });
      return;
    }

    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.categoryId, categoryId))
      .orderBy(productsTable.sortOrder);

    res.status(200).json({
      success: true,
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener productos'
    });
  }
};
// #end-middleware

// #middleware getProductById
/**
 * Middleware: getProductById
 * 
 * Obtiene un producto por su ID.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getProductById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener producto'
    });
  }
};
// #end-middleware

// #middleware updateProduct
/**
 * Middleware: updateProduct
 * 
 * Actualiza un producto existente.
 * Si se actualiza stock y hay control activo, actualiza isAvailable automáticamente.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateProductId
 * - verifyProductOwnership
 * - validateUpdateProductPayload
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const updates = req.body;

    // Obtener producto actual para comparar stock
    const [currentProduct] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!currentProduct) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Preparar updates
    const finalUpdates: any = {
      updatedAt: new Date()
    };

    // Agregar campos actualizables
    if (updates.name !== undefined) finalUpdates.name = updates.name.trim();
    if (updates.description !== undefined) finalUpdates.description = updates.description || null;
    if (updates.basePrice !== undefined) finalUpdates.basePrice = String(updates.basePrice);
    if (updates.discount !== undefined) finalUpdates.discount = updates.discount !== null ? String(updates.discount) : null;
    if (updates.hasStockControl !== undefined) finalUpdates.hasStockControl = updates.hasStockControl;
    if (updates.currentStock !== undefined) finalUpdates.currentStock = updates.currentStock;
    if (updates.stockAlertThreshold !== undefined) finalUpdates.stockAlertThreshold = updates.stockAlertThreshold;
    if (updates.stockStopThreshold !== undefined) finalUpdates.stockStopThreshold = updates.stockStopThreshold;
    if (updates.isAvailable !== undefined) finalUpdates.isAvailable = updates.isAvailable;

    // Determinar si hay control de stock activo
    const hasStockControl = updates.hasStockControl !== undefined 
      ? updates.hasStockControl 
      : currentProduct.hasStockControl;

    // Auto-actualizar isAvailable si hay cambio de stock y control activo
    if (hasStockControl) {
      const newStock = updates.currentStock !== undefined 
        ? updates.currentStock 
        : currentProduct.currentStock;
      
      const stopThreshold = updates.stockStopThreshold !== undefined
        ? updates.stockStopThreshold
        : currentProduct.stockStopThreshold;

      if (newStock !== null && stopThreshold !== null && newStock <= stopThreshold) {
        finalUpdates.isAvailable = false;
      } else if (updates.isAvailable === undefined) {
        // Si no se especificó manualmente y el stock está bien, activar
        if (newStock !== null && stopThreshold !== null && newStock > stopThreshold) {
          finalUpdates.isAvailable = true;
        }
      }
    }

    // Actualizar producto
    const [updatedProduct] = await db
      .update(productsTable)
      .set(finalUpdates)
      .where(eq(productsTable.id, productId))
      .returning();

    res.status(200).json({
      success: true,
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto'
    });
  }
};
// #end-middleware

// #middleware deleteProduct
/**
 * Middleware: deleteProduct
 * 
 * Elimina un producto (hard delete).
 * También elimina todas sus imágenes de Cloudinary.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - validateProductId
 * - verifyProductOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);

    // Obtener producto para verificar imágenes
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Eliminar imágenes de Cloudinary si existen
    if (product.images) {
      try {
        const config = loadConfig();
        const rootFolder = config.rootFolder;
        const { folder } = CLOUDINARY_FOLDERS.products.images(productId, rootFolder);
        
        // Eliminar toda la carpeta del producto
        // Nota: Cloudinary no tiene API directa para eliminar carpetas,
        // así que eliminamos las imágenes individualmente
        const imageUrls: string[] = JSON.parse(product.images);
        
        for (const imageUrl of imageUrls) {
          // Extraer publicId de la URL
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('.')[0];
          const publicId = `${folder}/${fileName}`;
          
          try {
            await deleteFile(publicId);
          } catch (error) {
            // Continuar aunque falle una imagen
            console.error(`Error eliminando imagen ${publicId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error eliminando imágenes del producto:', error);
      }
    }

    // Eliminar producto de la BD
    await db
      .delete(productsTable)
      .where(eq(productsTable.id, productId));

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto'
    });
  }
};
// #end-middleware

// #middleware reorderProducts
/**
 * Middleware: reorderProducts
 * 
 * Actualiza el sortOrder de múltiples productos.
 * 
 * Body: {
 *   updates: Array<{ id: number, sortOrder: number }>
 * }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const reorderProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'updates debe ser un array no vacío'
      });
      return;
    }

    // Validar cada update
    for (const update of updates) {
      if (!update.id || typeof update.id !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Cada update debe tener un id válido'
        });
        return;
      }

      if (update.sortOrder === undefined || typeof update.sortOrder !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Cada update debe tener un sortOrder válido'
        });
        return;
      }
    }

    // Actualizar cada producto
    for (const update of updates) {
      await db
        .update(productsTable)
        .set({ 
          sortOrder: update.sortOrder,
          updatedAt: new Date()
        })
        .where(eq(productsTable.id, update.id));
    }

    res.status(200).json({
      success: true,
      message: 'Productos reordenados exitosamente'
    });
  } catch (error) {
    console.error('Error reordenando productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reordenar productos'
    });
  }
};
// #end-middleware

// #middleware uploadProductImages
/**
 * Middleware: uploadProductImages
 * 
 * Sube múltiples imágenes a un producto.
 * Máximo 6 imágenes totales.
 * La primera imagen del array es la imagen principal.
 * 
 * Requiere:
 * - validateJWTAndGetPayload
 * - multer configurado para múltiples archivos (req.files)
 * - verifyProductOwnership
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y files
 * @param {Response} res - Response de Express
 */
export const uploadProductImages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No se subieron archivos'
      });
      return;
    }

    // Obtener producto actual
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Parsear imágenes existentes
    let existingImages: string[] = [];
    if (product.images) {
      try {
        existingImages = JSON.parse(product.images);
      } catch (error) {
        console.error('Error parseando imágenes existentes:', error);
      }
    }

    // Validar límite de 6 imágenes
    if (existingImages.length + files.length > 6) {
      res.status(400).json({
        success: false,
        error: `Máximo 6 imágenes permitidas. Actualmente tienes ${existingImages.length}`
      });
      return;
    }

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;
    const { folder } = CLOUDINARY_FOLDERS.products.images(productId, rootFolder);

    // Subir cada archivo
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = existingImages.length + i + 1;
      
      const uploadResult = await uploadFile(file.buffer, {
        folder,
        publicId: `image-${imageIndex}`,
        overwrite: false,
        resourceType: 'image',
        tags: ['product-image', `product-${productId}`],
      });

      uploadedUrls.push(uploadResult.secureUrl);
    }

    // Combinar imágenes existentes con nuevas
    const allImages = [...existingImages, ...uploadedUrls];

    // Actualizar producto
    const [updatedProduct] = await db
      .update(productsTable)
      .set({
        images: JSON.stringify(allImages),
        updatedAt: new Date()
      })
      .where(eq(productsTable.id, productId))
      .returning();

    res.status(200).json({
      success: true,
      message: `${uploadedUrls.length} imagen(es) subida(s) exitosamente`,
      data: {
        product: updatedProduct,
        uploadedImages: uploadedUrls
      }
    });
  } catch (error: any) {
    console.error('Error subiendo imágenes del producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir imágenes',
      details: error.message
    });
  }
};
// #end-middleware

// #middleware deleteProductImage
/**
 * Middleware: deleteProductImage
 * 
 * Elimina una imagen específica de un producto.
 * 
 * Body: {
 *   imageUrl: string // URL de la imagen a eliminar
 * }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteProductImage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const { imageUrl } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: 'imageUrl es requerido'
      });
      return;
    }

    // Obtener producto actual
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Parsear imágenes existentes
    let existingImages: string[] = [];
    if (product.images) {
      try {
        existingImages = JSON.parse(product.images);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Error parseando imágenes del producto'
        });
        return;
      }
    }

    // Verificar que la imagen existe
    if (!existingImages.includes(imageUrl)) {
      res.status(404).json({
        success: false,
        error: 'Imagen no encontrada en el producto'
      });
      return;
    }

    // Extraer publicId de la URL para eliminar de Cloudinary
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const config = loadConfig();
      const rootFolder = config.rootFolder;
      const { folder } = CLOUDINARY_FOLDERS.products.images(productId, rootFolder);
      const publicId = `${folder}/${fileName}`;

      await deleteFile(publicId);
    } catch (error) {
      console.error('Error eliminando imagen de Cloudinary:', error);
      // Continuar aunque falle Cloudinary
    }

    // Eliminar de la lista
    const updatedImages = existingImages.filter(url => url !== imageUrl);

    // Actualizar producto
    const [updatedProduct] = await db
      .update(productsTable)
      .set({
        images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : null,
        updatedAt: new Date()
      })
      .where(eq(productsTable.id, productId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Error eliminando imagen del producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar imagen'
    });
  }
};
// #end-middleware

// #middleware reorderProductImages
/**
 * Middleware: reorderProductImages
 * 
 * Reordena las imágenes de un producto.
 * La primera imagen del array será la imagen principal.
 * 
 * Body: {
 *   images: string[] // Array de URLs en el nuevo orden
 * }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const reorderProductImages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      res.status(400).json({
        success: false,
        error: 'images debe ser un array no vacío'
      });
      return;
    }

    // Obtener producto actual
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
      return;
    }

    // Parsear imágenes existentes
    let existingImages: string[] = [];
    if (product.images) {
      try {
        existingImages = JSON.parse(product.images);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Error parseando imágenes del producto'
        });
        return;
      }
    }

    // Validar que todas las URLs del nuevo array existan en el producto
    for (const imageUrl of images) {
      if (!existingImages.includes(imageUrl)) {
        res.status(400).json({
          success: false,
          error: `Imagen ${imageUrl} no pertenece al producto`
        });
        return;
      }
    }

    // Validar que todas las URLs del producto estén en el nuevo array
    if (images.length !== existingImages.length) {
      res.status(400).json({
        success: false,
        error: 'El array debe contener todas las imágenes del producto'
      });
      return;
    }

    // Actualizar producto
    const [updatedProduct] = await db
      .update(productsTable)
      .set({
        images: JSON.stringify(images),
        updatedAt: new Date()
      })
      .where(eq(productsTable.id, productId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Imágenes reordenadas exitosamente',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Error reordenando imágenes del producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reordenar imágenes'
    });
  }
};
// #end-middleware