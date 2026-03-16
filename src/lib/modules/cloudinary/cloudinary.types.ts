// cloudinary.types.ts
/* #info - Tipos e interfaces del módulo Cloudinary */

// #type ImageSource - Fuente de imagen soportada por el módulo
/**
 * @description
 * Fuente de imagen soportada por el módulo Cloudinary.
 *
 * @purpose
 * Restringir y tipar los formatos de entrada de imágenes aceptados por el módulo.
 *
 * @context
 * Utilizado como parámetro de entrada en las funciones de creación y reemplazo de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type ImageSource =
	| { type: 'url'; url: string }
	| { type: 'file'; filePath: string }
	| { type: 'buffer'; buffer: Buffer };
// #end-type
// #interface CreateImageOptions - Opciones para crear una imagen en Cloudinary
/**
 * @description
 * Opciones requeridas para crear (subir) una imagen en Cloudinary.
 *
 * @purpose
 * Centralizar los parámetros de configuración necesarios para identificar y organizar la imagen en Cloudinary.
 *
 * @context
 * Utilizado por la función principal de creación de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface CreateImageOptions {
	// #v-field overwrite - Permite sobreescribir imagen existente
	/** indica si se permite sobreescribir una imagen existente con el mismo public_id */
	overwrite?: boolean;
	// #end-v-field
	// #v-field name - Nombre de la imagen
	/** nombre que tendrá la imagen en Cloudinary */
	name: string;
	// #end-v-field
	// #v-field folder - Carpeta de destino
	/** carpeta de destino dentro de Cloudinary */
	folder: string;
	// #end-v-field
	// #v-field prefix - Prefijo opcional del nombre
	/** prefijo opcional aplicado al nombre de la imagen */
	prefix?: string;
	// #end-v-field
}
// #end-interface
// #interface ImageMetadata - Metadata personalizada para una imagen en Cloudinary
/**
 * @description
 * Metadata custom (context) para asociar a una imagen en Cloudinary.
 *
 * @purpose
 * Permitir almacenar información adicional junto a la imagen para facilitar su búsqueda y gestión.
 *
 * @context
 * Utilizado en las operaciones de creación y actualización de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ImageMetadata {
	// #v-field name - Nombre original de la imagen
	/** nombre original de la imagen */
	name?: string;
	// #end-v-field
	// #v-field folder - Carpeta de la imagen
	/** carpeta donde se encuentra la imagen */
	folder?: string;
	// #end-v-field
	// #v-field prefix - Prefijo de la imagen
	/** prefijo aplicado al nombre de la imagen */
	prefix?: string;
	// #end-v-field
	[key: string]: string | number | boolean | undefined;
}
// #end-interface
// #interface ReplaceImageOptions - Opciones para reemplazar una imagen existente
/**
 * @description
 * Opciones de configuración para la operación de reemplazo de una imagen existente.
 *
 * @purpose
 * Parametrizar el comportamiento del reemplazo de imágenes en Cloudinary.
 *
 * @context
 * Utilizado como argumento opcional en la función de reemplazo del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ReplaceImageOptions {
	// #v-field overwrite - Fuerza la sobreescritura
	/** fuerza la sobreescritura de la imagen existente */
	overwrite?: true;
	// #end-v-field
}
// #end-interface
// #interface ReplaceImageParams - Parámetros para reemplazar una imagen existente
/**
 * @description
 * Parámetros completos para la operación de reemplazo de una imagen en Cloudinary.
 *
 * @purpose
 * Centralizar los datos necesarios para identificar la imagen a reemplazar y la nueva fuente.
 *
 * @context
 * Utilizado por la función de reemplazo de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ReplaceImageParams {
	// #v-field publicId - Identificador público de la imagen a reemplazar
	/** identificador público de la imagen existente en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field source - Nueva fuente de imagen
	/** nueva fuente de imagen que reemplazará a la existente */
	source: ImageSource;
	// #end-v-field
	// #v-field metadata - Metadata opcional de la imagen
	/** metadata opcional a asociar a la nueva imagen */
	metadata?: Record<string, unknown>;
	// #end-v-field
	// #v-field overwrite - Permite sobreescribir
	/** indica si se permite sobreescribir la imagen */
	overwrite?: boolean;
	// #end-v-field
}
// #end-interface
// #interface RenameImageParams - Parámetros para renombrar una imagen
/**
 * @description
 * Parámetros requeridos para renombrar una imagen en Cloudinary.
 *
 * @purpose
 * Identificar la imagen a renombrar y proveer el nuevo nombre a aplicar.
 *
 * @context
 * Utilizado por la función de renombrado de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface RenameImageParams {
	// #v-field publicId - Identificador público actual de la imagen
	/** identificador público actual de la imagen en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field newName - Nuevo nombre de la imagen
	/** nuevo nombre a aplicar a la imagen */
	newName: string;
	// #end-v-field
}
// #end-interface
// #interface MoveImageParams - Parámetros para mover una imagen a otra carpeta
/**
 * @description
 * Parámetros requeridos para mover una imagen a otra carpeta en Cloudinary.
 *
 * @purpose
 * Identificar la imagen a mover y la carpeta de destino.
 *
 * @context
 * Utilizado por la función de movimiento de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface MoveImageParams {
	// #v-field publicId - Identificador público de la imagen a mover
	/** identificador público de la imagen en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field targetFolder - Carpeta de destino
	/** carpeta de destino a la que se moverá la imagen */
	targetFolder: string;
	// #end-v-field
}
// #end-interface
// #interface ChangeImagePrefixParams - Parámetros para cambiar el prefijo de una imagen
/**
 * @description
 * Parámetros requeridos para modificar el prefijo del nombre de una imagen en Cloudinary.
 *
 * @purpose
 * Identificar la imagen y definir cómo se aplica el cambio de prefijo.
 *
 * @context
 * Utilizado por la función de cambio de prefijo del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ChangeImagePrefixParams {
	// #v-field publicId - Identificador público de la imagen
	/** identificador público de la imagen en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field prefix - Nuevo prefijo a aplicar
	/** prefijo a aplicar al nombre de la imagen */
	prefix?: string;
	// #end-v-field
	// #v-field mode - Modo de aplicación del prefijo
	/** modo de aplicación: replace reemplaza, append agrega al final, prepend agrega al inicio */
	mode: 'replace' | 'append' | 'prepend';
	// #end-v-field
}
// #end-interface
// #interface CreateImageResponse - Respuesta normalizada luego del upload
/**
 * @description
 * Respuesta normalizada retornada luego de subir una imagen a Cloudinary.
 *
 * @purpose
 * Proveer al consumidor del módulo los datos clave de la imagen recién creada en un formato consistente.
 *
 * @context
 * Retornado por la función de creación de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface CreateImageResponse {
	// #v-field publicId - Identificador público de la imagen creada
	/** identificador público asignado a la imagen en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field url - URL pública de la imagen
	/** URL pública accesible de la imagen */
	url: string;
	// #end-v-field
	// #v-field width - Ancho de la imagen en píxeles
	/** ancho de la imagen en píxeles */
	width: number;
	// #end-v-field
	// #v-field height - Alto de la imagen en píxeles
	/** alto de la imagen en píxeles */
	height: number;
	// #end-v-field
	// #v-field format - Formato de la imagen
	/** formato del archivo de imagen (ej: jpg, png, webp) */
	format: string;
	// #end-v-field
	// #v-field size - Tamaño del archivo en bytes
	/** tamaño del archivo en bytes */
	size: number;
	// #end-v-field
	// #v-field metadata - Metadata asociada a la imagen
	/** metadata opcional asociada a la imagen */
	metadata?: ImageMetadata;
	// #end-v-field
	// #v-field raw - Respuesta cruda de Cloudinary
	/** respuesta cruda original de la API de Cloudinary */
	raw?: unknown;
	// #end-v-field
}
// #end-interface
// #interface ReplaceImageResponse - Respuesta al reemplazar una imagen
/**
 * @description
 * Respuesta retornada luego de reemplazar una imagen en Cloudinary.
 *
 * @purpose
 * Proveer al consumidor del módulo los datos de la imagen actualizada tras la operación de reemplazo.
 *
 * @context
 * Retornado por la función de reemplazo de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ReplaceImageResponse {
	// #v-field publicId - Identificador público de la imagen reemplazada
	/** identificador público de la imagen en Cloudinary */
	publicId: string;
	// #end-v-field
	// #v-field secureUrl - URL segura de la imagen actualizada
	/** URL segura (HTTPS) de la imagen actualizada */
	secureUrl: string;
	// #end-v-field
	// #v-field metadata - Metadata de la imagen actualizada
	/** metadata asociada a la imagen actualizada */
	metadata: Record<string, unknown>;
	// #end-v-field
	// #v-field raw - Respuesta cruda de Cloudinary
	/** respuesta cruda original de la API de Cloudinary */
	raw: unknown;
	// #end-v-field
}
// #end-interface
// #interface DeleteImageResponse - Respuesta al eliminar una imagen
/**
 * @description
 * Respuesta retornada luego de eliminar una imagen en Cloudinary.
 *
 * @purpose
 * Confirmar al consumidor del módulo si la operación de eliminación fue exitosa.
 *
 * @context
 * Retornado por la función de eliminación de imágenes del módulo Cloudinary.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface DeleteImageResponse {
	// #v-field deleted - Indica si la imagen fue eliminada
	/** indica si la imagen fue eliminada correctamente */
	deleted: boolean;
	// #end-v-field
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
