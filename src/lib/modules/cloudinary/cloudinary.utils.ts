// cloudinary.utils.ts
/* #info - Utilities for Cloudinary module */
// #section Imports
import type {
	CreateImageResponse,
	ImageMetadata,
	ReplaceImageResponse,
	GetPublicIdFromUrlResult,
} from './cloudinary.types';
import { ValidationError } from './cloudinary.errors';
// #end-section
// #function _normalizePublicIdPart - Normaliza un segmento de publicId
/**
 * Normaliza un segmento de publicId (lowercase, sin espacios, sin caracteres inválidos).
 * @param value Segmento original
 * @returns Segmento normalizado
 * @internal
 * @version 1.0.0
 */
export const _normalizePublicIdPart = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-_]/g, '')
		.replace(/-+/g, '-')
		.replace(/^[-_]+|[-_]+$/g, '');
// #end-function
// #function _normalizeFolder - Normaliza el nombre de carpeta
/**
 * Normaliza el nombre de carpeta removiendo slashes innecesarios.
 * @param folder Carpeta original
 * @returns Carpeta normalizada
 * @internal
 * @version 1.0.0
 */
export const _normalizeFolder = (folder: string): string =>
	folder
		.replace(/^\/+/, '')
		.replace(/\/+$/, '')
		.replace(new RegExp('/+', 'g'), '/')
		.split('/')
		.map((part) => _normalizePublicIdPart(part))
		.filter(Boolean)
		.join('/');
// #end-function
// #function _toContextMetadata - Convierte metadata a context válido
/**
 * Convierte metadata a un objeto de strings compatible con Cloudinary.
 * @param metadata Metadata custom
 * @returns Context metadata listo para Cloudinary
 * @internal
 * @version 1.0.0
 */
export const _toContextMetadata = (
	metadata?: ImageMetadata
): Record<string, string> | undefined => {
	if (!metadata) return undefined;

	const entries = Object.entries(metadata).map(([key, value]) => [key, String(value)]);
	return entries.length ? Object.fromEntries(entries) : undefined;
};
// #end-function
// #function _isPlainObject - Valida si es objeto plano
/**
 * Valida si el valor es un objeto plano.
 * @param value Valor a validar
 * @returns boolean
 * @internal
 * @version 1.0.0
 */
export const _isPlainObject = (value: unknown): boolean => {
	if (!value || typeof value !== 'object') return false;
	if (Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};
// #end-function
// #function _hasNonSerializableValue - Detecta valores no serializables
/**
 * Detecta valores no serializables dentro de un objeto.
 * @param value Valor a inspeccionar
 * @returns boolean
 * @internal
 * @version 1.0.0
 */
export const _hasNonSerializableValue = (value: unknown): boolean => {
	const visited = new Set<unknown>();
	const stack: unknown[] = [value];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		if (visited.has(current)) continue;
		visited.add(current);

		if (typeof current === 'function' || typeof current === 'symbol') {
			return true;
		}

		if (typeof current === 'object') {
			for (const next of Object.values(current as Record<string, unknown>)) {
				stack.push(next);
			}
		}
	}

	return false;
};
// #end-function
// #function _buildPublicId - Construye publicId desde folder/prefix/name
/**
 * Construye publicId normalizado para Cloudinary.
 * @param folder Carpeta destino
 * @param name Nombre base
 * @param prefix Prefijo opcional
 * @returns Objeto con folder y publicId normalizados
 * @throws ValidationError si el resultado queda vacío
 * @internal
 * @version 1.0.0
 */
export const _buildPublicId = (
	folder: string,
	name: string,
	prefix?: string
): { folder: string; publicId: string; name: string; prefix?: string } => {
	const normalizedFolder = _normalizeFolder(folder);
	const normalizedName = _normalizePublicIdPart(name);
	const normalizedPrefix = prefix ? _normalizePublicIdPart(prefix) : '';
	const publicId = normalizedPrefix
		? `${normalizedPrefix}--${normalizedName}`
		: normalizedName;

	if (!normalizedFolder || !publicId) {
		throw new ValidationError('Folder o nombre inválido tras normalización.');
	}

	return {
		folder: normalizedFolder,
		publicId,
		name: normalizedName,
		prefix: normalizedPrefix || undefined,
	};
};
// #end-function
// #function _buildPublicIdFromIdentity - Construye publicId desde metadata
/**
 * Construye publicId desde metadata almacenada (folder, name, prefix).
 * @param identity Identidad almacenada en metadata
 * @returns publicId
 * @internal
 * @version 1.0.0
 */
export const _buildPublicIdFromIdentity = (identity: {
	folder: string;
	name: string;
	prefix?: string;
}): string => {
	const baseName = identity.prefix
		? `${identity.prefix}--${identity.name}`
		: identity.name;

	return identity.folder ? `${identity.folder}/${baseName}` : baseName;
};
// #end-function
// #function _getStoredIdentity - Extrae identidad desde metadata
/**
 * Extrae identidad (name, folder, prefix) desde metadata.
 * @param metadata Metadata custom
 * @param publicId PublicId del recurso
 * @throws ValidationError si falta metadata requerida
 * @internal
 * @version 1.0.0
 */
export const _getStoredIdentity = (
	metadata: Record<string, any>,
	publicId: string
): { name: string; folder: string; prefix?: string } => {
	const name = metadata?.name;
	const folder = metadata?.folder;
	const prefix = metadata?.prefix;

	if (typeof name !== 'string' || !name.trim()) {
		throw new ValidationError(`Metadata incompleta: falta name para ${publicId}.`);
	}

	_validateNameSegment(name, 'name');

	if (folder !== undefined && folder !== null && typeof folder !== 'string') {
		throw new ValidationError(`Metadata incompleta: folder inválido para ${publicId}.`);
	}

	if (folder) {
		_validateFolderPath(folder);
	}

	if (prefix !== undefined && prefix !== null) {
		if (typeof prefix !== 'string' || !prefix.trim()) {
			throw new ValidationError(`Metadata incompleta: prefix inválido para ${publicId}.`);
		}
		_validateNameSegment(prefix, 'prefix');
	}

	return {
		name,
		folder: folder || '',
		prefix: prefix || undefined,
	};
};
// #end-function
// #function _validatePublicId - Valida formato de publicId
/**
 * Valida formato del publicId para eliminar recursos.
 * @param publicId Public ID a validar
 * @throws ValidationError si el formato es inválido
 * @internal
 * @version 1.0.0
 */
export const _validatePublicId = (publicId: string): void => {
	if (!publicId || !publicId.trim()) {
		throw new ValidationError('El publicId es requerido.');
	}

	if (!/^[a-z0-9/_-]+$/.test(publicId)) {
		throw new ValidationError('El publicId tiene un formato inválido.');
	}

	if (publicId.includes('//') || publicId.startsWith('/') || publicId.endsWith('/')) {
		throw new ValidationError('El publicId tiene un formato inválido.');
	}

	if (publicId.includes('..')) {
		throw new ValidationError('El publicId tiene un formato inválido.');
	}
};
// #end-function
// #function _validateNameSegment - Valida nombre sin slashes
/**
 * Valida un segmento de nombre (sin slashes).
 * @param value Nombre a validar
 * @param label Etiqueta para el mensaje de error
 * @throws ValidationError si el formato es inválido
 * @internal
 * @version 1.0.0
 */
export const _validateNameSegment = (value: string, label = 'nombre'): void => {
	if (!value || !value.trim()) {
		throw new ValidationError(`El ${label} es requerido.`);
	}

	if (value.includes('/')) {
		throw new ValidationError(`El ${label} no puede contener '/'.`);
	}

	if (!/^[a-z0-9_-]+$/.test(value)) {
		throw new ValidationError(`El ${label} tiene un formato inválido.`);
	}

	if (value.includes('..')) {
		throw new ValidationError(`El ${label} tiene un formato inválido.`);
	}
};
// #end-function
// #function _validateFolderPath - Valida ruta de carpeta
/**
 * Valida el formato de una carpeta sin normalizarla.
 * @param folder Carpeta a validar
 * @throws ValidationError si el formato es inválido
 * @internal
 * @version 1.0.0
 */
export const _validateFolderPath = (folder: string): void => {
	if (!folder || !folder.trim()) {
		throw new ValidationError('La carpeta destino es requerida.');
	}

	if (!/^[a-z0-9/_-]+$/.test(folder)) {
		throw new ValidationError('La carpeta destino tiene un formato inválido.');
	}

	if (folder.includes('//') || folder.startsWith('/') || folder.endsWith('/')) {
		throw new ValidationError('La carpeta destino tiene un formato inválido.');
	}

	if (folder.includes('..')) {
		throw new ValidationError('La carpeta destino tiene un formato inválido.');
	}
};
// #end-function
// #function _splitPublicId - Separa folder y nombre
/**
 * Separa un publicId en folder y nombre.
 * @param publicId Public ID completo
 * @returns folder y name
 * @internal
 * @version 1.0.0
 */
export const _splitPublicId = (
	publicId: string
): { folder: string; name: string } => {
	const index = publicId.lastIndexOf('/');
	if (index === -1) {
		return { folder: '', name: publicId };
	}

	return {
		folder: publicId.slice(0, index),
		name: publicId.slice(index + 1),
	};
};
// #end-function
// #function _normalizeCreateImageResponse - Normaliza la respuesta raw del SDK
/**
 * Normaliza la respuesta raw de Cloudinary a CreateImageResponse.
 * @param raw Respuesta raw del SDK
 * @param fallbackMetadata Metadata enviada en el upload
 * @returns CreateImageResponse normalizado
 * @internal
 * @version 1.0.0
 */
export const _normalizeCreateImageResponse = (
	raw: Record<string, unknown>,
	fallbackMetadata?: ImageMetadata
): CreateImageResponse => {
	const rawRecord = raw as Record<string, any>;
	const rawMetadata = rawRecord?.context?.custom as ImageMetadata | undefined;

	return {
		publicId: rawRecord.public_id,
		url: rawRecord.secure_url || rawRecord.url,
		width: rawRecord.width ?? 0,
		height: rawRecord.height ?? 0,
		format: rawRecord.format,
		size: rawRecord.bytes ?? 0,
		metadata: rawMetadata ?? fallbackMetadata,
		raw: raw,
	};
};
// #end-function
// #function _normalizeReplaceImageResponse - Normaliza respuesta de replaceImage
/**
 * Normaliza la respuesta raw de Cloudinary para replaceImage.
 * @param raw Respuesta raw del SDK
 * @param metadata Metadata enviada en el replace
 * @returns ReplaceImageResponse normalizado
 * @internal
 * @version 1.0.0
 */
export const _normalizeReplaceImageResponse = (
	raw: Record<string, unknown>,
	metadata: Record<string, any>
): ReplaceImageResponse => {
	const rawRecord = raw as Record<string, any>;
	return {
		publicId: rawRecord.public_id,
		secureUrl: rawRecord.secure_url || rawRecord.url,
		metadata,
		raw,
	};
};
// #end-function
// #function _normalizeListImageResult - Normaliza un recurso de listado
/**
 * Normaliza un recurso raw de Cloudinary a GetImageResult.
 * Filtra recursos incompletos (campos obligatorios faltantes).
 * @param raw Recurso raw del SDK
 * @returns GetImageResult normalizado o null si está incompleto
 * @internal
 * @version 1.0.0
 */
export const _normalizeListImageResult = (
	raw: Record<string, any>
): { publicId: string; url: string; secureUrl: string; width: number; height: number; format: string; bytes: number; metadata: Record<string, any>; raw: Record<string, any> } | null => {
	// Validar campos obligatorios
	if (!raw.public_id) return null;
	if (!raw.secure_url && !raw.url) return null;
	if (typeof raw.width !== 'number') return null;
	if (typeof raw.height !== 'number') return null;

	// Extraer metadata de context.custom
	const rawMetadata = raw?.context?.custom as Record<string, any> | undefined;

	return {
		publicId: raw.public_id,
		url: raw.url || raw.secure_url,
		secureUrl: raw.secure_url || raw.url,
		width: raw.width,
		height: raw.height,
		format: raw.format || '',
		bytes: raw.bytes || 0,
		metadata: rawMetadata || {},
		raw: raw,
	};
};
// #end-function
// #function _validateImageSource - Valida fuente de imagen
/**
 * Valida una fuente de imagen (url, file o buffer).
 * @param source Fuente de imagen a validar
 * @throws ValidationError si la fuente es inválida
 * @internal
 * @version 1.0.0
 */
export const _validateImageSource = (source: any): void => {
	if (!source) {
		throw new ValidationError('El source es requerido.');
	}

	if (!['url', 'file', 'buffer'].includes(source.type)) {
		throw new ValidationError('Tipo de fuente de imagen no soportado.');
	}

	if (source.type === 'url' && !source.url?.trim()) {
		throw new ValidationError('La URL de la imagen no es válida.');
	}

	if (source.type === 'file') {
		if (!source.filePath?.trim()) {
			throw new ValidationError('La ruta del archivo no es válida.');
		}

		// Importar fs aquí para evitar dependencia circular
		const fs = require('fs');
		if (!fs.existsSync(source.filePath)) {
			throw new ValidationError(`No se encontró el archivo: ${source.filePath}`);
		}
	}

	if (source.type === 'buffer' && !Buffer.isBuffer(source.buffer)) {
		throw new ValidationError('El buffer de la imagen no es válido.');
	}
};
// #end-function
// #function _handleCloudinaryRenameError - Maneja errores de rename/move
/**
 * Mapea errores de Cloudinary rename a errores específicos del módulo.
 * @param error Error capturado
 * @param ErrorClass Clase de error a usar (RenameImageError o MoveImageError)
 * @param publicId PublicId original
 * @param targetPublicId PublicId destino
 * @throws NotFoundError si 404
 * @throws ErrorClass con mensaje apropiado
 * @internal
 * @version 1.0.0
 */
export const _handleCloudinaryRenameError = (
	error: any,
	ErrorClass: any,
	publicId: string,
	targetPublicId: string
): never => {
	// Importar dinámicamente para evitar dependencia circular
	const { NotFoundError } = require('./cloudinary.errors');

	if (error?.error?.http_code === 404) {
		throw new NotFoundError(publicId);
	}

	const message = error?.message || `Error al ${ErrorClass.name.includes('Rename') ? 'renombrar' : 'mover'} la imagen en Cloudinary.`;
	const errorMessage = error?.error?.message || error?.message || '';
	
	if (error?.error?.http_code === 409 || /already exists|already_exists/i.test(errorMessage)) {
		throw new ErrorClass('El publicId destino ya existe.', {
			publicId,
			targetPublicId,
		}, error);
	}
	
	throw new ErrorClass(message, { publicId, targetPublicId }, error);
};
// #end-function
// #function _handleCloudinaryFetchError - Maneja errores de fetch/list
/**
 * Mapea errores HTTP de Cloudinary a FetchImageError con mensajes específicos.
 * @param error Error capturado
 * @param context Contexto adicional (publicId, folder, etc)
 * @throws FetchImageError con mensaje apropiado
 * @internal
 * @version 1.0.0
 */
export const _handleCloudinaryFetchError = (
	error: any,
	context: Record<string, any>
): never => {
	// Importar dinámicamente para evitar dependencia circular
	const { FetchImageError, ValidationError, ConfigurationError, NotFoundError } = require('./cloudinary.errors');

	// Re-lanzar errores que ya son de nuestro módulo
	if (error instanceof ValidationError || error instanceof ConfigurationError || error instanceof NotFoundError) {
		throw error;
	}

	if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED') {
		throw new FetchImageError('Error de red al obtener imagen.', context, error);
	}

	if (error?.error?.http_code === 401 || error?.error?.http_code === 403) {
		throw new FetchImageError('Error de autenticación al obtener imagen.', context, error);
	}

	if (error?.error?.http_code && error.error.http_code >= 500) {
		throw new FetchImageError('Error del servicio Cloudinary.', context, error);
	}

	throw new FetchImageError(
		error?.message || 'Error al obtener la imagen en Cloudinary.',
		context,
		error
	);
};
// #end-function
// #function _normalizeGetImageResult - Normaliza resultado de getImage desde api.resource
/**
 * Normaliza la respuesta de api.resource a GetImageResult.
 * @param result Respuesta raw de api.resource
 * @param publicId PublicId consultado
 * @returns GetImageResult normalizado
 * @throws FetchImageError si la respuesta es inválida
 * @internal
 * @version 1.0.0
 */
export const _normalizeGetImageResult = (
	result: any,
	publicId: string
): { publicId: string; url: string; secureUrl: string; width: number; height: number; format: string; bytes: number; metadata: Record<string, any>; raw: any } => {
	// Importar dinámicamente para evitar dependencia circular
	const { FetchImageError, NotFoundError } = require('./cloudinary.errors');

	if (result?.result === 'not found') {
		throw new NotFoundError(publicId);
	}

	if (!result || !result.public_id) {
		throw new FetchImageError('Respuesta inválida de Cloudinary.', { publicId }, result);
	}

	if (result?.resource_type && result.resource_type !== 'image') {
		throw new FetchImageError('El recurso no es una imagen.', {
			publicId,
			resourceType: result.resource_type,
		});
	}

	if (
		result?.secure_url == null ||
		result?.width == null ||
		result?.height == null
	) {
		throw new FetchImageError(
			'Respuesta incompleta de Cloudinary.',
			{ publicId },
			result
		);
	}

	const customContext = _isPlainObject(result?.context?.custom)
		? result.context.custom
		: {};
	const metadata = { ...customContext };

	return {
		publicId: result.public_id,
		url: result.url || '',
		secureUrl: result.secure_url || result.url || '',
		width: result.width ?? 0,
		height: result.height ?? 0,
		format: result.format,
		bytes: result.bytes ?? 0,
		metadata,
		raw: result,
	};
};
// #end-function
// #function _extractPublicIdFromCloudinaryUrl - Extrae el publicId de una URL de Cloudinary
/**
 * Extrae el publicId de una URL de Cloudinary.
 * 
 * Soporta URLs con los siguientes patrones:
 * - https://res.cloudinary.com/{cloud}/image/upload/v{version}/{publicId}.{ext}
 * - https://res.cloudinary.com/{cloud}/image/upload/{publicId}.{ext}
 * - https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{publicId}.{ext}
 * 
 * @param url URL completa de Cloudinary
 * @returns GetPublicIdFromUrlResult con publicId, folder, fileName y format
 * @throws ValidationError si la URL es vacía, no válida o no es de Cloudinary
 * @internal
 * @version 1.0.0
 */
export const _extractPublicIdFromCloudinaryUrl = (url: string): GetPublicIdFromUrlResult => {
	// Validar entrada
	if (!url || typeof url !== 'string' || !url.trim()) {
		throw new ValidationError('La URL es requerida.');
	}

	const trimmedUrl = url.trim();

	// Validar que sea una URL válida
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(trimmedUrl);
	} catch {
		throw new ValidationError('La URL proporcionada no tiene un formato válido.');
	}

	// Validar que sea una URL de Cloudinary
	if (!parsedUrl.hostname.includes('cloudinary.com')) {
		throw new ValidationError('La URL no pertenece a Cloudinary.');
	}

	// Extraer el path y buscar el segmento después de /upload/
	const path = parsedUrl.pathname;
	const uploadIndex = path.indexOf('/upload/');
	if (uploadIndex === -1) {
		throw new ValidationError('La URL no contiene un path de upload válido de Cloudinary.');
	}

	// Todo lo que viene después de /upload/
	let afterUpload = path.slice(uploadIndex + '/upload/'.length);

	// Remover segmento de versión si existe (v + dígitos seguido de /)
	afterUpload = afterUpload.replace(/^v\d+\//, '');

	// Remover transformaciones de Cloudinary
	// Las transformaciones contienen patrones como: w_100,h_200/ o c_fill,g_face/ etc.
	// Se detectan por segmentos que contienen al menos un underscore entre letras y valores
	const segments = afterUpload.split('/');
	const cleanSegments: string[] = [];

	for (const segment of segments) {
		// Saltar segmentos de versión (v + solo dígitos) que no estuvieran al inicio
		if (/^v\d+$/.test(segment)) {
			continue;
		}
		// Un segmento es transformación si contiene parámetros tipo key_value separados por comas
		const isTransformation = /^[a-z]{1,3}_[^/]+/.test(segment) && segment.includes('_');
		// Excepto el último segmento que es el filename
		const isLastSegment = segment === segments[segments.length - 1];

		if (isTransformation && !isLastSegment) {
			continue; // Saltar transformaciones
		}
		cleanSegments.push(segment);
	}

	const cleanPath = cleanSegments.join('/');

	if (!cleanPath) {
		throw new ValidationError('No se pudo extraer el publicId de la URL proporcionada.');
	}

	// Separar extensión del archivo
	const lastDotIndex = cleanPath.lastIndexOf('.');
	let publicId: string;
	let format: string;

	if (lastDotIndex > 0 && lastDotIndex > cleanPath.lastIndexOf('/')) {
		publicId = cleanPath.slice(0, lastDotIndex);
		format = cleanPath.slice(lastDotIndex + 1);
	} else {
		publicId = cleanPath;
		format = '';
	}

	if (!publicId) {
		throw new ValidationError('No se pudo extraer el publicId de la URL proporcionada.');
	}

	// Separar folder y fileName
	const lastSlashIndex = publicId.lastIndexOf('/');
	let folder: string;
	let fileName: string;

	if (lastSlashIndex > -1) {
		folder = publicId.slice(0, lastSlashIndex);
		fileName = publicId.slice(lastSlashIndex + 1);
	} else {
		folder = '';
		fileName = publicId;
	}

	return {
		publicId,
		folder,
		fileName,
		format,
	};
};
// #end-function