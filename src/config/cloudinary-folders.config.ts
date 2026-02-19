/**
 * CLOUDINARY FOLDERS CONFIG
 *
 * Define la estructura de carpetas y naming conventions para recursos en Cloudinary.
 * Cada entidad tiene su propio namespace con funciones que generan { folder, name }
 * compatibles con createImage() del módulo Cloudinary.
 *
 * El rootFolder es opcional y permite agrupar todo bajo un prefijo
 * (ej: "dev", "staging", "production").
 *
 * Uso:
 *   const { folder, name } = CLOUDINARY_FOLDERS.companies.logos(companyId, rootFolder);
 *   await createImage(source, { folder, name, overwrite: true });
 */

function buildFullFolder(subFolder: string, rootFolder?: string): string {
  if (!rootFolder) return subFolder;
  return `${rootFolder}/${subFolder}`;
}

export interface CloudinaryFolderResult {
  folder: string;
  name: string;
  prefix?: string;
}

export const CLOUDINARY_FOLDERS = {
  users: {
    avatars: (userId: number, rootFolder?: string): CloudinaryFolderResult => ({
      folder: buildFullFolder(`users/${userId}`, rootFolder),
      name: `user-${userId}-avatar`,
    }),
  },

  companies: {
    logos: (companyId: number, companyName: string, rootFolder?: string): CloudinaryFolderResult => ({
      folder: buildFullFolder('companies', rootFolder),
      name: companyName,
      prefix: `company-${companyId}`,
    }),
  },

  categories: {
    images: (categoryId: number, rootFolder?: string): CloudinaryFolderResult => ({
      folder: buildFullFolder(`categories/${categoryId}`, rootFolder),
      name: `category-${categoryId}-image`,
    }),
  },

  products: {
    images: (productId: number, rootFolder?: string): CloudinaryFolderResult => ({
      folder: `${rootFolder ? `${rootFolder}/products` : 'products'}/product-${productId}`,
      name: 'image',
    }),
  },
} as const;
