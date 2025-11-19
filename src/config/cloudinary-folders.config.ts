/* src/config/cloudinary-folders.config.ts */

/**
 * Configuración de estructura de carpetas de Cloudinary.
 * Define las rutas y publicIds para cada tipo de entidad.
 * 
 * Este archivo es parte de la aplicación, NO del módulo de Cloudinary.
 */

// #function buildFullFolder
/**
 * Construye la ruta completa de carpeta.
 */
function buildFullFolder(subFolder: string, rootFolder?: string): string {
  if (!rootFolder) {
    return subFolder;
  }
  return `${rootFolder}/${subFolder}`;
}
// #end-function

// #export CLOUDINARY_FOLDERS
/**
 * Estructura de carpetas y publicIds para cada entidad.
 */
export const CLOUDINARY_FOLDERS = {
  users: {
    avatars: (userId: number, rootFolder?: string) => ({
      folder: buildFullFolder(`users/${userId}`, rootFolder),
      publicId: `user-${userId}-avatar`,
    }),
  },

  companies: {
    logos: (companyId: number, rootFolder?: string) => ({
      folder: buildFullFolder(`companies/${companyId}`, rootFolder),
      publicId: `company-${companyId}-logo`,
    }),
  },

  categories: {
    images: (categoryId: number, rootFolder?: string) => ({
      folder: buildFullFolder(`categories/${categoryId}`, rootFolder),
      publicId: `category-${categoryId}-image`,
    }),
  },

  // Productos (imágenes de productos)
  products: {
    /**
     * Carpeta para las imágenes de un producto.
     * Estructura: {rootFolder}/products/product-{productId}/
     * 
     * @param productId - ID del producto
     * @param rootFolder - Carpeta raíz del proyecto (opcional)
     * @returns { folder, publicId }
     */
    images: (productId: number, rootFolder?: string) => {
      const base = rootFolder ? `${rootFolder}/products` : 'products';
      return {
        folder: `${base}/product-${productId}`,
        publicId: `image` // Se complementará con índice en el middleware
      };
    }
  },
} as const;
// #end-export