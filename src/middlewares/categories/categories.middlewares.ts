/* src/middlewares/categories/categories.middlewares.ts */
// #section Imports
import { Response } from "express";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { uploadFile, deleteFile, loadConfig, NotFoundError } from '../../modules/cloudinary';
import { CLOUDINARY_FOLDERS } from '../../config/cloudinary-folders.config';
// #end-section

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