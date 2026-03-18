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
 * @description Normaliza un segmento de publicId (lowercase, sin espacios, sin caracteres inválidos).
 * @purpose Asegurar que cada parte del publicId sea compatible con las restricciones de Cloudinary.
 * @context Utilizado por _buildPublicId y _normalizeFolder para garantizar segmentos válidos.
 * @param value segmento original del publicId
 * @returns segmento normalizado en minúsculas con guiones como separadores
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Normaliza el nombre de una carpeta removiendo slashes innecesarios y normalizando cada segmento.
 * @purpose Garantizar que las rutas de carpeta sean válidas y consistentes para Cloudinary.
 * @context Utilizado por _buildPublicId al preparar la carpeta de destino antes de un upload.
 * @param folder carpeta original posiblemente con slashes al inicio/final o dobles
 * @returns carpeta normalizada sin slashes innecesarios con cada segmento en minúsculas
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Convierte metadata custom a un objeto de strings compatible con el campo context de Cloudinary.
 * @purpose Asegurar que la metadata se serialice correctamente antes de enviarse al SDK de Cloudinary.
 * @context Utilizado por createImage, replaceImage y otras operaciones que guardan metadata en el contexto del recurso.
 * @param metadata metadata custom del recurso de imagen
 * @returns objeto de strings compatible con Cloudinary context, o undefined si no hay metadata
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Valida si un valor es un objeto plano (no array ni instancia de clase).
 * @purpose Garantizar que solo se acepten objetos planos como metadata, evitando estructuras no serializables.
 * @context Utilizado por replaceImage para validar la metadata del usuario antes de procesarla.
 * @param value valor a validar
 * @returns true si el valor es un objeto plano
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Detecta si un objeto contiene valores no serializables como funciones o símbolos.
 * @purpose Prevenir errores al serializar metadata antes de enviarla a Cloudinary.
 * @context Utilizado por replaceImage para validar la metadata del usuario antes de procesarla.
 * @param value valor a inspeccionar recursivamente
 * @returns true si el objeto contiene al menos un valor no serializable
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Construye el publicId normalizado para Cloudinary a partir de folder, nombre y prefijo opcionales.
 * @purpose Centralizar la lógica de construcción del publicId garantizando rutas consistentes.
 * @context Utilizado por createImage para calcular el publicId del recurso antes de subirlo.
 * @param folder carpeta destino del recurso
 * @param name nombre base del recurso
 * @param prefix prefijo opcional que se antepone al nombre con separador '--'
 * @returns objeto con folder, publicId, name y prefix normalizados
 * @throws ValidationError si el resultado queda vacío tras normalización
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Construye el publicId a partir de la identidad almacenada en la metadata del recurso.
 * @purpose Reconstruir el publicId de un recurso para operaciones de rename/move/changePrefix.
 * @context Utilizado por renameImage, moveImage y changeImagePrefix para calcular el nuevo publicId objetivo.
 * @param identity identidad almacenada en metadata con folder, name y prefix opcionales
 * @returns publicId resultante en formato folder/prefix--name
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Extrae y valida la identidad (name, folder, prefix) desde la metadata almacenada del recurso.
 * @purpose Garantizar que la metadata sea completa y válida antes de operaciones de edición.
 * @context Utilizado por renameImage, moveImage y changeImagePrefix para recuperar el estado actual del recurso.
 * @param metadata metadata custom del recurso de imagen
 * @param publicId publicId del recurso para mensajes de error descriptivos
 * @returns objeto con name, folder y prefix opcional del recurso
 * @throws ValidationError si falta metadata requerida o tiene formato inválido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Valida el formato del publicId para operaciones de Cloudinary.
 * @purpose Prevenir llamadas al SDK con publicIds inválidos que causarían errores en tiempo de ejecución.
 * @context Utilizado al inicio de todas las operaciones del módulo que reciben un publicId.
 * @param publicId Public ID a validar
 * @throws ValidationError si el formato del publicId es inválido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Valida que un segmento de nombre sea correcto (sin slashes ni caracteres inválidos).
 * @purpose Prevenir nombres con formato inválido antes de construir publicIds.
 * @context Utilizado por _buildPublicId, renameImage y changeImagePrefix al validar nombres y prefijos.
 * @param value nombre a validar
 * @param label etiqueta descriptiva para mensajes de error
 * @throws ValidationError si el formato del nombre es inválido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Valida el formato de una ruta de carpeta sin normalizarla.
 * @purpose Prevenir rutas inválidas de carpeta antes de operaciones de listado o construcción de publicIds.
 * @context Utilizado por listImages, moveImage y otras operaciones que aceptan rutas de carpeta.
 * @param folder carpeta a validar
 * @throws ValidationError si el formato de la carpeta es inválido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Separa un publicId en sus componentes de carpeta y nombre.
 * @purpose Facilitar la extracción de folder y filename de un publicId compuesto.
 * @context Utilizado internamente para descomponer publicIds en operaciones de gestión de recursos.
 * @param publicId publicId completo en formato folder/name o solo name
 * @returns objeto con folder y name del recurso
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Normaliza la respuesta raw del SDK de Cloudinary tras crear una imagen.
 * @purpose Abstraer la estructura interna del SDK y retornar un formato consistente al consumidor.
 * @context Utilizado por createImage para retornar CreateImageResponse al finalizarse el upload.
 * @param raw respuesta raw del SDK de Cloudinary
 * @param fallbackMetadata metadata enviada en el upload como respaldo si no está en la respuesta
 * @returns respuesta normalizada con los campos útiles del recurso creado
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Normaliza la respuesta raw del SDK de Cloudinary tras reemplazar una imagen.
 * @purpose Abstraer la estructura interna del SDK y retornar un formato consistente al consumidor.
 * @context Utilizado por replaceImage para retornar ReplaceImageResponse al finalizar el reemplazo.
 * @param raw respuesta raw del SDK de Cloudinary
 * @param metadata metadata del recurso enviada en el replace
 * @returns respuesta normalizada con el publicId, URL y metadata actualizados
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Normaliza un recurso raw del listado de Cloudinary a GetImageResult.
 * @purpose Abstraer la estructura interna del SDK para el listado de recursos y filtrar resultados incompletos.
 * @context Utilizado por listImages al procesar cada recurso del array de resultados del SDK.
 * @param raw recurso raw de la respuesta del SDK de Cloudinary
 * @returns GetImageResult normalizado, o null si el recurso está incompleto
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Valida la fuente de imagen (tipo url, file o buffer) antes de una operación de upload.
 * @purpose Prevenir uploads con datos de entrada inválidos antes de llamar al SDK de Cloudinary.
 * @context Utilizado por createImage y replaceImage al inicio de la operación de upload.
 * @param source fuente de imagen a validar (puede ser url, filePath o buffer)
 * @throws ValidationError si la fuente es inválida, el archivo no existe o el buffer está vacío
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Mapea los errores del SDK de Cloudinary durante rename a errores específicos del módulo.
 * @purpose Centralizar el manejo de errores de la operación rename para rename y move.
 * @context Utilizado por renameImage, moveImage y changeImagePrefix al capturar errores del SDK.
 * @param error error capturado del SDK de Cloudinary
 * @param ErrorClass clase de error a instanciar (RenameImageError o MoveImageError)
 * @param publicId publicId original del recurso
 * @param targetPublicId publicId destino de la operación
 * @throws NotFoundError si el recurso no existe (HTTP 404)
 * @throws ErrorClass con mensaje apropiado según el tipo de error
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Mapea errores HTTP del SDK de Cloudinary durante fetch/list a FetchImageError con mensajes específicos.
 * @purpose Centralizar el manejo de errores de consulta para getImage y listImages.
 * @context Utilizado por getImage y listImages al capturar errores del SDK de Cloudinary.
 * @param error error capturado del SDK de Cloudinary
 * @param context contexto adicional (publicId, folder, etc.) para incluir en el error
 * @throws FetchImageError con mensaje apropiado según el tipo de error HTTP
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Normaliza la respuesta de api.resource a GetImageResult.
 * @purpose Abstraer la estructura interna del SDK de Cloudinary tras obtener un recurso individual.
 * @context Utilizado por getImage para retornar una respuesta consistente al consumidor.
 * @param result respuesta raw de api.resource de Cloudinary
 * @param publicId publicId consultado para contexto en mensajes de error
 * @returns datos normalizados del recurso de imagen
 * @throws FetchImageError si la respuesta es inválida o incompleta
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
 * @description Extrae el publicId y metadatos de una URL de Cloudinary.
 * @purpose Permitir obtener el publicId a partir de la URL del recurso cuando el ID no está disponible directamente.
 * @context Utilizado por getPublicIdFromUrl (cloudinary.ts) como delegado de la extracción.
 * @param url URL completa de Cloudinary (soporta versiones, transformaciones y carpetas anidadas)
 * @returns objeto con publicId, folder, fileName y format extraïdos de la URL
 * @throws ValidationError si la URL es vacía, no válida o no es de Cloudinary
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
// #function _isImageBuffer - Detecta si un buffer contiene una imagen válida
/**
 * Magic bytes de formatos de imagen soportados por Cloudinary.
 * @internal
 */
const IMAGE_SIGNATURES: { bytes: number[]; offset?: number }[] = [
	{ bytes: [0xFF, 0xD8, 0xFF] },                                     // JPEG
	{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },     // PNG
	{ bytes: [0x47, 0x49, 0x46, 0x38] },                               // GIF (87a / 89a)
	{ bytes: [0x52, 0x49, 0x46, 0x46] },                               // WebP (RIFF container)
	{ bytes: [0x42, 0x4D] },                                           // BMP
	{ bytes: [0x00, 0x00, 0x01, 0x00] },                               // ICO
	{ bytes: [0x49, 0x49, 0x2A, 0x00] },                               // TIFF (little-endian)
	{ bytes: [0x4D, 0x4D, 0x00, 0x2A] },                               // TIFF (big-endian)
];

/**
 * @description Verifica si un buffer corresponde a un formato de imagen conocido analizando sus magic bytes.
 * @purpose Detectar el formato de imagen para fail-fast sin red antes de intento de upload.
 * @context Utilizado por isImageBuffer (función pública de cloudinary.ts) como implementación de la detección.
 * @param buffer Buffer a analizar (se comparan los primeros bytes con firmas conocidas)
 * @returns true si el buffer coincide con un formato soportado (JPEG, PNG, GIF, WebP, BMP, ICO, TIFF, SVG)
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const _isImageBuffer = (buffer: Buffer): boolean => {
	if (!Buffer.isBuffer(buffer) || buffer.length < 2) return false;

	// SVG: formato basado en texto
	const head = buffer.subarray(0, 256).toString('utf-8').trimStart();
	if (head.startsWith('<svg') || head.startsWith('<?xml')) return true;

	// Formatos binarios: comparar magic bytes
	return IMAGE_SIGNATURES.some(({ bytes, offset = 0 }) => {
		if (buffer.length < offset + bytes.length) return false;
		return bytes.every((byte, i) => buffer[offset + i] === byte);
	});
};
// #end-function