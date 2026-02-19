/**
 * Operaciones de Cloudinary para logos de compañías
 *
 * Utilidades compartidas entre updateCompanyService y deleteCompanyService.
 * Centralizan el naming y la interacción con Cloudinary para logos.
 */

import { createImage, deleteImage } from '../../../lib/modules/cloudinary';
import type { ImageSource } from '../../../lib/modules/cloudinary';
import { CLOUDINARY_FOLDERS } from '../../../config/cloudinary-folders.config';

/**
 * Sube el logo de una compañía a Cloudinary.
 * Ruta: {rootFolder}/companies/company-{id}--{name}
 * Con overwrite: true, crear y reemplazar usan la misma operación.
 *
 * @param companyId - ID de la compañía
 * @param companyName - Nombre de la compañía (se normaliza automáticamente)
 * @param fileBuffer - Buffer de la imagen
 * @returns URL segura de la imagen subida
 */
export async function uploadCompanyLogo(companyId: number, companyName: string, fileBuffer: Buffer): Promise<string> {
  const rootFolder = process.env.CLOUDINARY_ROOT_FOLDER || undefined;
  const { folder, name, prefix } = CLOUDINARY_FOLDERS.companies.logos(companyId, companyName, rootFolder);

  const source: ImageSource = { type: 'buffer', buffer: fileBuffer };
  const result = await createImage(
    source,
    { name, folder, prefix, overwrite: true },
    { companyId: String(companyId) }
  );

  return result.url;
}

/**
 * Elimina el logo de una compañía de Cloudinary.
 * Manejo graceful: no lanza error si el logo ya fue eliminado.
 *
 * @param companyId - ID de la compañía
 * @param companyName - Nombre de la compañía (para construir el publicId)
 */
export async function deleteCompanyLogo(companyId: number, companyName: string): Promise<void> {
  const rootFolder = process.env.CLOUDINARY_ROOT_FOLDER || undefined;
  const { folder, name, prefix } = CLOUDINARY_FOLDERS.companies.logos(companyId, companyName, rootFolder);
  const publicIdPart = prefix ? `${prefix}--${name}` : name;
  const fullPublicId = `${folder}/${publicIdPart}`;

  try {
    await deleteImage(fullPublicId);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      console.warn(`Logo not found in Cloudinary: ${fullPublicId} (already deleted)`);
    } else {
      console.error('Error deleting logo from Cloudinary:', error.message);
    }
  }
}
