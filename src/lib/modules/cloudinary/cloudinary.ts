// cloudinary.ts
/* #info - Core service functions for Cloudinary image creation */
// #section Imports
import type {
	ImageSource,
	CreateImageOptions,
	ImageMetadata,
	CreateImageResponse,
	ReplaceImageParams,
	ReplaceImageResponse,
	GetImageResult,
	RenameImageParams,
	MoveImageParams,
	ChangeImagePrefixParams,
	ListImagesParams,
	ListImagesResult,
	DeleteImageResponse,
	GetPublicIdFromUrlResult,
} from './cloudinary.types';
import { getCloudinaryClient } from './cloudinary.config';
import {
	_buildPublicId,
	_buildPublicIdFromIdentity,
	_getStoredIdentity,
	_toContextMetadata,
	_normalizeCreateImageResponse,
	_validatePublicId,
	_isPlainObject,
	_hasNonSerializableValue,
	_normalizeReplaceImageResponse,
	_validateNameSegment,
	_validateFolderPath,
	_normalizeListImageResult,
	_validateImageSource,
	_handleCloudinaryRenameError,
	_handleCloudinaryFetchError,
	_normalizeGetImageResult,
	_extractPublicIdFromCloudinaryUrl,
	_isImageBuffer,
} from './cloudinary.utils';
import {
	UploadError,
	ValidationError,
	DeleteError,
	NotFoundError,
	ReplaceImageError,
	FetchImageError,
	RenameImageError,
	MoveImageError,
} from './cloudinary.errors';
// #end-section
// #function createImage - Sube una imagen a Cloudinary y retorna datos normalizados
/**
 * @description Sube una imagen a Cloudinary y retorna la respuesta normalizada.
 * @purpose Proveer una interfaz unificada para subir imágenes desde URL, archivo o buffer con soporte de metadata.
 * @context Utilizado por los servicios del servidor que necesiten crear imágenes en Cloudinary (avatares, logos, etc.).
 * @param image fuente de la imagen (url, filePath o buffer)
 * @param options opciones de creación (nombre, carpeta, prefix, overwrite)
 * @param metadata metadatos custom que se guardan como context en el recurso
 * @returns respuesta normalizada con datos útiles y el raw de Cloudinary
 * @throws ValidationError si la entrada no es válida
 * @throws UploadError si el upload falla
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const createImage = async (
	image: ImageSource,
	options: CreateImageOptions,
	metadata?: ImageMetadata
): Promise<CreateImageResponse> => {
	// #step 1 - Validar entrada principal
	_validateImageSource(image);

	if (!options?.name?.trim()) {
		throw new ValidationError('El nombre de la imagen es requerido.');
	}

	if (!options?.folder?.trim()) {
		throw new ValidationError('La carpeta de destino es requerida.');
	}
	// #end-step
	// #step 2 - Configurar cliente y parámetros del upload
	const cloudinary = getCloudinaryClient();

	const { folder, publicId, name: normalizedName, prefix: normalizedPrefix } = _buildPublicId(
		options.folder,
		options.name,
		options.prefix
	);
	const storedMetadata: ImageMetadata = {
		...(metadata ?? {}),
		name: normalizedName,
		folder,
		...(normalizedPrefix ? { prefix: normalizedPrefix } : {}),
	};

	const uploadParams: Record<string, unknown> = {
		folder,
		public_id: publicId,
		overwrite: options.overwrite ?? false,
		resource_type: 'image',
		context: _toContextMetadata(storedMetadata),
	};
	// #end-step
	// #step 3 - Resolver el tipo de fuente y ejecutar el upload
	let result: any;

	try {
		if (image.type === 'url') {
			result = await cloudinary.uploader.upload(image.url, uploadParams);
		} else if (image.type === 'file') {
			result = await cloudinary.uploader.upload(image.filePath, uploadParams);
		} else if (image.type === 'buffer') {
			const base64 = image.buffer.toString('base64');
			const dataUri = `data:application/octet-stream;base64,${base64}`;
			result = await cloudinary.uploader.upload(dataUri, uploadParams);
		} else {
			throw new ValidationError('Tipo de fuente de imagen no soportado.');
		}
	} catch (error: any) {
		if (error instanceof ValidationError) {
			throw error;
		}

		const message = error?.message || 'Error al subir la imagen a Cloudinary.';
		throw new UploadError(message, { image, options, metadata }, error);
	}
	// #step 4 - Validar overwrite cuando el recurso ya existe
	if (options.overwrite === false && result?.existing === true) {
		throw new UploadError('El recurso ya existe y overwrite es false.', {
			image,
			options,
			metadata,
		});
	}
	// #end-step

	// #step 5 - Normalizar la respuesta
	return _normalizeCreateImageResponse(result, storedMetadata);
	// #end-step
};
// #end-function
// #function deleteImage - Elimina una imagen por publicId
/**
 * @description Elimina una imagen de Cloudinary por su publicId.
 * @purpose Proveer la operación de borrado de recursos en Cloudinary para el ciclo de vida de imágenes.
 * @context Utilizado al eliminar avatares de usuario, logos de compañía u otros recursos de imagen.
 * @param publicId Public ID del recurso a eliminar
 * @returns respuesta con deleted=true si se eliminó correctamente
 * @throws ValidationError si el publicId es inválido
 * @throws NotFoundError si el recurso no existe
 * @throws DeleteError si falla la eliminación
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const deleteImage = async (publicId: string): Promise<DeleteImageResponse> => {
	// #step 1 - Validar publicId
	_validatePublicId(publicId);
	// #end-step

	// #step 2 - Ejecutar eliminación
	const cloudinary = getCloudinaryClient();

	try {
		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: 'image',
		});

		if (result?.result === 'not found') {
			throw new NotFoundError(publicId);
		}

		if (result?.result === 'error') {
			throw new DeleteError('Error al eliminar la imagen en Cloudinary.', {
				publicId,
			});
		}

		return { deleted: true };
	} catch (error: any) {
		if (error instanceof ValidationError || error instanceof NotFoundError) {
			throw error;
		}

		const message = error?.message || 'Error al eliminar la imagen en Cloudinary.';
		throw new DeleteError(message, { publicId }, error);
	}
	// #end-step
};
// #end-function
// #function replaceImage - Reemplaza el binario de una imagen existente
/**
 * @description Reemplaza el binario de una imagen existente sin cambiar su publicId.
 * @purpose Actualizar el contenido visual de una imagen manteniendo su identificador y metadata.
 * @context Utilizado cuando el usuario actualiza su foto de perfil o logo sin cambiar su ruta en Cloudinary.
 * @param publicId Public ID del recurso a reemplazar
 * @param image fuente de la nueva imagen (url, filePath o buffer)
 * @param options opciones de reemplazo (overwrite siempre true internamente)
 * @param metadata metadata opcional para reemplazar el context del recurso
 * @returns respuesta normalizada con los nuevos datos del recurso
 * @throws ValidationError si la entrada no es válida
 * @throws UploadError si falla el reemplazo
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const replaceImage = async (
	params: ReplaceImageParams
): Promise<ReplaceImageResponse> => {
	const { publicId, source, metadata, overwrite } = params;

	// #step 1 - Validar parámetros de entrada
	_validatePublicId(publicId);
	_validateImageSource(source);

	if (overwrite === false) {
		throw new ValidationError('replaceImage requiere overwrite=true.');
	}

	if (metadata !== undefined && !_isPlainObject(metadata)) {
		throw new ValidationError('La metadata debe ser un objeto plano.');
	}

	if (metadata !== undefined && _hasNonSerializableValue(metadata)) {
		throw new ValidationError('La metadata contiene valores no serializables.');
	}
	// #end-step

	// #step 2 - Verificar existencia del recurso
	const cloudinary = getCloudinaryClient();
	let existingMetadata: Record<string, any> = {};
	let storedIdentity: { name: string; folder: string; prefix?: string } | null = null;
	try {
		const resource = await cloudinary.api.resource(publicId, {
			resource_type: 'image',
			context: true,
		});
		existingMetadata = resource?.context?.custom ?? {};
		storedIdentity = _getStoredIdentity(existingMetadata, publicId);
	} catch (error: any) {
		if (error?.error?.http_code === 404) {
			throw new NotFoundError(publicId);
		}
		throw error;
	}
	// #end-step

	// #step 3 - Preparar parámetros de upload
	const normalizedMetadata =
		metadata === undefined
			? { ...existingMetadata }
			: Object.keys(metadata).length === 0
				? {}
				: { ...existingMetadata, ...metadata };

	if (storedIdentity) {
		normalizedMetadata.name = storedIdentity.name;
		normalizedMetadata.folder = storedIdentity.folder;
		if (storedIdentity.prefix) {
			normalizedMetadata.prefix = storedIdentity.prefix;
		} else {
			delete normalizedMetadata.prefix;
		}
	}
	const uploadParams: Record<string, unknown> = {
		public_id: publicId,
		overwrite: true,
		invalidate: true,
		resource_type: 'image',
		context: _toContextMetadata(normalizedMetadata as ImageMetadata),
	};
	// #end-step

	// #step 4 - Ejecutar upload según tipo de fuente
	let result: any;

	try {
		if (source.type === 'url') {
			result = await cloudinary.uploader.upload(source.url, uploadParams);
		} else if (source.type === 'file') {
			result = await cloudinary.uploader.upload(source.filePath, uploadParams);
		} else if (source.type === 'buffer') {
			const base64 = source.buffer.toString('base64');
			const dataUri = `data:application/octet-stream;base64,${base64}`;
			result = await cloudinary.uploader.upload(dataUri, uploadParams);
		} else {
			throw new ValidationError('Tipo de fuente de imagen no soportado.');
		}
	} catch (error: any) {
		if (error instanceof ValidationError || error instanceof NotFoundError) {
			throw error;
		}

		const message = error?.message || 'Error al reemplazar la imagen en Cloudinary.';
		if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED') {
			throw new ReplaceImageError(message, { publicId, source, metadata }, error);
		}
		throw new UploadError(message, { publicId, source, metadata }, error);
	}
	// #end-step

	// #step 5 - Normalizar respuesta
	return _normalizeReplaceImageResponse(result, normalizedMetadata as Record<string, any>);
	// #end-step
};
// #end-function
// #function renameImage - Renombra una imagen sin reupload
/**
 * @description Renombra una imagen existente en Cloudinary sin resubir su contenido.
 * @purpose Actualizar el nombre del recurso y su publicId cuando el usuario cambia el nombre del activo.
 * @context Utilizado para operaciones de renombre en la gestión de activos de imagen del servidor.
 * @param params parámetros con publicId y newName del recurso
 * @returns datos normalizados del recurso renombrado
 * @throws ValidationError si la entrada no es válida
 * @throws NotFoundError si el recurso no existe
 * @throws RenameImageError si falla el renombre
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const renameImage = async (
	params: RenameImageParams
): Promise<GetImageResult> => {
	const { publicId, newName } = params;

	// #step 1 - Validar parámetros
	_validatePublicId(publicId);
	_validateNameSegment(newName, 'newName');
	// #end-step

	// #step 2 - Construir nuevo publicId
	const current = await getImage(publicId);
	const identity = _getStoredIdentity(current.metadata, publicId);
	if (newName === identity.name) {
		throw new ValidationError('El nuevo nombre debe ser distinto al actual.');
	}
	const targetPublicId = _buildPublicIdFromIdentity({
		folder: identity.folder,
		name: newName,
		prefix: identity.prefix,
	});
	_validatePublicId(targetPublicId);
	// #end-step

	// #step 3 - Ejecutar rename
	const cloudinary = getCloudinaryClient();
	try {
		await cloudinary.uploader.rename(publicId, targetPublicId, {
			resource_type: 'image',
			overwrite: false,
		});
	} catch (error: any) {
		_handleCloudinaryRenameError(error, RenameImageError, publicId, targetPublicId);
	}
	// #end-step

	// #step 4 - Actualizar metadata almacenada
	try {
		const updatedMetadata: ImageMetadata = {
			...current.metadata,
			name: newName,
			folder: identity.folder,
			...(identity.prefix ? { prefix: identity.prefix } : {}),
		};
		await cloudinary.api.update(targetPublicId, {
			resource_type: 'image',
			context: _toContextMetadata(updatedMetadata),
		});
	} catch (error: any) {
		const message = error?.message || 'Error al actualizar metadata en Cloudinary.';
		throw new RenameImageError(message, { publicId, targetPublicId }, error);
	}
	// #end-step

	// #step 5 - Obtener datos normalizados
	return getImage(targetPublicId);
	// #end-step
};
// #end-function
// #function moveImage - Mueve una imagen a otra carpeta
/**
 * @description Mueve una imagen existente a otra carpeta de Cloudinary sin resubir su contenido.
 * @purpose Reorganizar recursos de imagen entre carpetas del sistema de archivos de Cloudinary.
 * @context Utilizado para mover activos entre carpetas de usuario, compañía u otras categorías.
 * @param params parámetros con publicId y targetFolder de destino
 * @returns datos normalizados del recurso movido con la nueva ruta
 * @throws ValidationError si la entrada no es válida
 * @throws NotFoundError si el recurso no existe
 * @throws MoveImageError si falla el movimiento
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const moveImage = async (
	params: MoveImageParams
): Promise<GetImageResult> => {
	const { publicId, targetFolder } = params;

	// #step 1 - Validar parámetros
	_validatePublicId(publicId);
	_validateFolderPath(targetFolder);
	// #end-step

	// #step 2 - Construir nuevo publicId
	const current = await getImage(publicId);
	const identity = _getStoredIdentity(current.metadata, publicId);
	if (identity.folder === targetFolder) {
		throw new ValidationError('La carpeta destino debe ser distinta a la actual.');
	}
	const targetPublicId = _buildPublicIdFromIdentity({
		folder: targetFolder,
		name: identity.name,
		prefix: identity.prefix,
	});
	_validatePublicId(targetPublicId);
	// #end-step

	// #step 3 - Ejecutar rename
	const cloudinary = getCloudinaryClient();
	try {
		await cloudinary.uploader.rename(publicId, targetPublicId, {
			resource_type: 'image',
			overwrite: false,
		});
	} catch (error: any) {
		_handleCloudinaryRenameError(error, MoveImageError, publicId, targetPublicId);
	}
	// #end-step

	// #step 4 - Actualizar metadata almacenada
	try {
		const updatedMetadata: ImageMetadata = {
			...current.metadata,
			name: identity.name,
			folder: targetFolder,
			...(identity.prefix ? { prefix: identity.prefix } : {}),
		};
		await cloudinary.api.update(targetPublicId, {
			resource_type: 'image',
			context: _toContextMetadata(updatedMetadata),
		});
	} catch (error: any) {
		const message = error?.message || 'Error al actualizar metadata en Cloudinary.';
		throw new MoveImageError(message, { publicId, targetPublicId }, error);
	}
	// #end-step

	// #step 5 - Obtener datos normalizados
	return getImage(targetPublicId);
	// #end-step
};
// #end-function
// #function changeImagePrefix - Cambia el prefijo de una imagen
/**
 * @description Cambia el prefijo del nombre de una imagen delegando en renameImage.
 * @purpose Gestionar prefijos identificadores en los nombres de recursos para organizar activos por categoría.
 * @context Utilizado para añadir, reemplazar o anteponer prefijos a imágenes existentes en Cloudinary.
 * @param params parámetros de cambio de prefijo (publicId, prefix, mode)
 * @returns datos normalizados del recurso con el nuevo nombre
 * @throws ValidationError si la entrada no es válida
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const changeImagePrefix = async (
	params: ChangeImagePrefixParams
): Promise<GetImageResult> => {
	const { publicId, prefix, mode } = params;

	// #step 1 - Validar parámetros
	_validatePublicId(publicId);
	if (!mode || !['replace', 'append', 'prepend'].includes(mode)) {
		throw new ValidationError('El mode es requerido y debe ser válido.');
	}

	if (prefix !== undefined) {
		_validateNameSegment(prefix, 'prefix');
	}

	if ((mode === 'append' || mode === 'prepend') && !prefix) {
		throw new ValidationError('El prefix es requerido para append/prepend.');
	}
	// #end-step

	// #step 2 - Calcular nuevo nombre
	const current = await getImage(publicId);
	const identity = _getStoredIdentity(current.metadata, publicId);
	const separator = '--';
	const existingPrefix = identity.prefix || '';

	let newPrefix = existingPrefix;
	if (mode === 'replace') {
		if (!prefix) {
			newPrefix = '';
		} else if (existingPrefix === prefix) {
			newPrefix = existingPrefix;
		} else {
			newPrefix = prefix;
		}
	}

	if (mode === 'prepend' && prefix) {
		if (existingPrefix === prefix || existingPrefix.startsWith(`${prefix}${separator}`)) {
			newPrefix = existingPrefix;
		} else {
			newPrefix = existingPrefix
				? `${prefix}${separator}${existingPrefix}`
				: prefix;
		}
	}

	if (mode === 'append' && prefix) {
		if (existingPrefix === prefix || existingPrefix.endsWith(`${separator}${prefix}`)) {
			newPrefix = existingPrefix;
		} else {
			newPrefix = existingPrefix
				? `${existingPrefix}${separator}${prefix}`
				: prefix;
		}
	}

	const targetPublicId = _buildPublicIdFromIdentity({
		folder: identity.folder,
		name: identity.name,
		prefix: newPrefix || undefined,
	});
	_validatePublicId(targetPublicId);
	// #end-step

	// #step 3 - Delegar en renameImage
	if (targetPublicId === publicId) {
		return getImage(publicId);
	}

	const cloudinary = getCloudinaryClient();
	try {
		await cloudinary.uploader.rename(publicId, targetPublicId, {
			resource_type: 'image',
			overwrite: false,
		});
	} catch (error: any) {
		_handleCloudinaryRenameError(error, RenameImageError, publicId, targetPublicId);
	}

	try {
		const updatedMetadata: ImageMetadata = {
			...current.metadata,
			name: identity.name,
			folder: identity.folder,
			...(newPrefix ? { prefix: newPrefix } : {}),
		};
		await cloudinary.api.update(targetPublicId, {
			resource_type: 'image',
			context: _toContextMetadata(updatedMetadata),
		});
	} catch (error: any) {
		const message = error?.message || 'Error al actualizar metadata en Cloudinary.';
		throw new RenameImageError(message, { publicId, targetPublicId }, error);
	}

	return getImage(targetPublicId);
	// #end-step
};
// #end-function
// #function getImage - Obtiene una imagen por publicId
/**
 * @description Obtiene los datos de una imagen desde Cloudinary por su publicId.
 * @purpose Recuperar metadatos y URL de un recurso de imagen para uso en el servidor o cliente.
 * @context Utilizado por otros servicios que necesitan acceder a un recurso específico sin listar.
 * @param publicId Public ID del recurso a consultar
 * @returns datos normalizados del recurso de imagen
 * @throws ValidationError si el publicId es inválido
 * @throws NotFoundError si el recurso no existe
 * @throws ConfigurationError si el cliente no está configurado
 * @throws FetchImageError si falla la consulta
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getImage = async (publicId: string): Promise<GetImageResult> => {
	// #step 1 - Validar publicId
	_validatePublicId(publicId);
	// #end-step
	// #step 2 - Consultar recurso
	const cloudinary = getCloudinaryClient();
	try {
		const result = await cloudinary.api.resource(publicId, {
			resource_type: 'image',
			context: true,
		});

		return _normalizeGetImageResult(result, publicId);
	} catch (error: any) {
		if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof FetchImageError) {
			throw error;
		}

		if (error?.error?.http_code === 404) {
			throw new NotFoundError(publicId);
		}

		throw _handleCloudinaryFetchError(error, { publicId });
	}
	// #end-step
};
// #end-function
// #function listImages - Lista imágenes en una carpeta
/**
 * @description Lista imágenes en una carpeta de Cloudinary con paginación y filtrado opcional por subdirectorios.
 * @purpose Proveer una vista paginada de los recursos de imagen para gestión de activos en el servidor.
 * @context Utilizado por endpoints de listado de imágenes, paneles de administración y galerías de activos.
 * @param params parámetros de listado (folder, recursive, limit, cursor)
 * @returns lista de imágenes normalizadas con cursor de paginación
 * @throws ValidationError si el folder es inválido o el limit está fuera de rango
 * @throws FetchImageError si falla la consulta a Cloudinary
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const listImages = async (params: ListImagesParams): Promise<ListImagesResult> => {
	// Validar folder
	_validateFolderPath(params.folder);

	// Validar limit
	const limit = params.limit ?? 20;
	if (limit < 1 || limit > 100) {
		throw new ValidationError('El límite debe estar entre 1 y 100.');
	}

	try {
		const client = getCloudinaryClient();

		// Construir prefix con '/' al final
		const prefix = `${params.folder}/`;

		// Construir opciones para api.resources
		const options: Record<string, any> = {
			type: 'upload',
			resource_type: 'image',
			prefix,
			max_results: limit,
			context: true,
		};

		// Agregar cursor si existe
		if (params.cursor) {
			options.next_cursor = params.cursor;
		}

		// Llamar a api.resources
		const response = await client.api.resources(options);

		// Normalizar recursos
		const items: GetImageResult[] = [];
		const resources = (response.resources || []) as Record<string, any>[];

		for (const raw of resources) {
			// Filtrar por resource_type si Cloudinary no lo hizo
			if (raw.resource_type !== 'image') continue;

			// Si no es recursive, filtrar subdirectorios
			if (!params.recursive) {
				const publicId = raw.public_id as string;
				if (!publicId) continue; // Saltar si no tiene publicId
				// Contar slashes después del prefix
				const afterPrefix = publicId.slice(prefix.length);
				if (afterPrefix.includes('/')) continue; // Está en subdirectorio
			}

			// Normalizar recurso
			const normalized = _normalizeListImageResult(raw);
			if (normalized) {
				items.push(normalized);
			}
		}

		// Asegurar que respetamos el límite después de filtrar
		const finalItems = items.slice(0, limit);

		// Extraer nextCursor
		const nextCursor = response.next_cursor ? String(response.next_cursor) : undefined;

		return {
			items: finalItems,
			nextCursor,
		};
	} catch (error: any) {
		// Mapear errores de Cloudinary
		if (error?.error?.http_code === 404) {
			// Folder vacío no es error, devolver items vacíos
			return {
				items: [],
				nextCursor: undefined,
			};
		}

		throw _handleCloudinaryFetchError(error, { folder: params.folder });
	}
};
// #end-function
// #function getPublicIdFromUrl - Extrae el publicId de una URL de Cloudinary
/**
 * @description Extrae el publicId y metadatos de una URL completa de Cloudinary.
 * @purpose Permitir obtener el publicId a partir de la URL almacenada cuando no se tiene el ID directamente.
 * @context Utilizado al procesar URLs de imágenes almacenadas en la base de datos para operaciones sobre el recurso.
 * @param url URL completa de Cloudinary (soporta versiones, transformaciones y carpetas anidadas)
 * @returns objeto con publicId, folder, fileName y format extraídos de la URL
 * @throws ValidationError si la URL es vacía, no válida o no es de Cloudinary
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getPublicIdFromUrl = (url: string): GetPublicIdFromUrlResult => {
	// #step 1 - Delegar la extracción a la utilidad interna
	return _extractPublicIdFromCloudinaryUrl(url);
	// #end-step
};
// #end-function
// #function isImageBuffer - Verifica si un buffer es una imagen soportada
/**
 * @description Verifica si un buffer corresponde a un formato de imagen conocido analizando sus magic bytes.
 * @purpose Fail-fast antes de intentar un upload a Cloudinary cuando el formato es claramente inválido.
 * @context Utilizado en validaciones previas al upload para evitar peticiones innecesarias a la red.
 * @param buffer Buffer a analizar (debe tener al menos los primeros bytes del archivo)
 * @returns true si el buffer coincide con un formato de imagen soportado (JPEG, PNG, GIF, WebP, BMP, ICO, TIFF, SVG)
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const isImageBuffer = (buffer: Buffer): boolean => {
	return _isImageBuffer(buffer);
};
// #end-function