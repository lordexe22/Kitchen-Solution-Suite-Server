// cloudinary.types.ts
/* #info - Type definitions for Cloudinary module */
// #type ImageSource
/**
 * Fuente de imagen soportada por el módulo.
 * @version 1.0.0
 */
export type ImageSource =
	| { type: 'url'; url: string }
	| { type: 'file'; filePath: string }
	| { type: 'buffer'; buffer: Buffer };
// #end-type
// #interface CreateImageOptions
/**
 * Opciones para crear una imagen en Cloudinary.
 * @version 1.0.0
 */
export interface CreateImageOptions {
	overwrite?: boolean;
	name: string;
	folder: string;
	prefix?: string;
}
// #end-interface
// #interface ImageMetadata
/**
 * Metadata custom (context) para Cloudinary.
 */
export interface ImageMetadata {
	name?: string;
	folder?: string;
	prefix?: string;
	[key: string]: string | number | boolean | undefined;
}
// #end-interface
// #interface ReplaceImageOptions
/**
 * Opciones para reemplazar una imagen existente.
 * @version 1.0.0
 */
export interface ReplaceImageOptions {
	overwrite?: true;
}
// #end-interface

// #interface ReplaceImageParams
/**
 * Parámetros para reemplazar una imagen existente.
 * @version 1.0.0
 */
export interface ReplaceImageParams {
	publicId: string;
	source: ImageSource;
	metadata?: Record<string, any>;
	overwrite?: boolean;
}
// #end-interface

// #interface RenameImageParams
/**
 * Parámetros para renombrar una imagen.
 * @version 1.0.0
 */
export interface RenameImageParams {
	publicId: string;
	newName: string;
}
// #end-interface

// #interface MoveImageParams
/**
 * Parámetros para mover una imagen a otra carpeta.
 * @version 1.0.0
 */
export interface MoveImageParams {
	publicId: string;
	targetFolder: string;
}
// #end-interface

// #interface ChangeImagePrefixParams
/**
 * Parámetros para cambiar prefijo de una imagen.
 * @version 1.0.0
 */
export interface ChangeImagePrefixParams {
	publicId: string;
	prefix?: string;
	mode: 'replace' | 'append' | 'prepend';
}
// #end-interface
// #interface CreateImageResponse
/**
 * Respuesta normalizada luego del upload.
 * @version 1.0.0
 */
export interface CreateImageResponse {
	publicId: string;
	url: string;
	width: number;
	height: number;
	format: string;
	size: number;
	metadata?: ImageMetadata;
	raw?: unknown;
}
// #end-interface

// #interface ReplaceImageResponse
/**
 * Respuesta al reemplazar una imagen.
 * @version 1.0.0
 */
export interface ReplaceImageResponse {
	publicId: string;
	secureUrl: string;
	metadata: Record<string, any>;
	raw: unknown;
}
// #end-interface
// #interface DeleteImageResponse
/**
 * Respuesta al eliminar una imagen.
 * @version 1.0.0
 */
export interface DeleteImageResponse {
	deleted: boolean;
}
// #end-interface

// #interface GetImageResult
/**
 * Respuesta al obtener una imagen.
 * @version 1.0.0
 */
export interface GetImageResult {
	publicId: string;
	url: string;
	secureUrl: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
	metadata: Record<string, any>;
	raw: Record<string, any>;
}
// #end-interface

// #interface ListImagesParams
/**
 * Parámetros para listar imágenes en una carpeta.
 * @version 1.0.0
 */
export interface ListImagesParams {
	folder: string;
	recursive?: boolean;
	limit?: number;
	cursor?: string;
}
// #end-interface

// #interface ListImagesResult
/**
 * Resultado de listar imágenes.
 * @version 1.0.0
 */
export interface ListImagesResult {
	items: GetImageResult[];
	nextCursor?: string;
}
// #end-interface

// #interface GetPublicIdFromUrlResult
/**
 * Resultado de extraer el publicId de una URL de Cloudinary.
 * @version 1.0.0
 */
export interface GetPublicIdFromUrlResult {
	/** PublicId completo (incluye folder + fileName) */
	publicId: string;
	/** Carpeta contenedora (vacío si está en la raíz) */
	folder: string;
	/** Nombre del archivo sin extensión */
	fileName: string;
	/** Extensión/formato del archivo (vacío si no tiene) */
	format: string;
}
// #end-interface
