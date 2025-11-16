// src/modules/cloudinary/cloudinary.utils.ts

import { Readable } from 'stream';
import type {
  UploadOptions,
  UploadResult,
  ResourceType,
  UploadSource,
} from './cloudinary.types';
import { ValidationError } from './cloudinary.errors';

// #region Validation Utilities

/**
 * Valida que un public ID sea válido.
 * 
 * @param publicId - Public ID a validar
 * @throws {ValidationError} Si el public ID es inválido
 */
export function validatePublicId(publicId: string): void {
  if (!publicId || typeof publicId !== 'string') {
    throw new ValidationError('Public ID must be a non-empty string');
  }

  if (publicId.trim().length === 0) {
    throw new ValidationError('Public ID cannot be empty or only whitespace');
  }
}

/**
 * Valida que una fuente de upload sea válida.
 * 
 * @param source - Fuente a validar
 * @throws {ValidationError} Si la fuente es inválida
 */
export function validateUploadSource(source: UploadSource): void {
  if (!source) {
    throw new ValidationError('Upload source cannot be null or undefined');
  }

  const isString = typeof source === 'string';
  const isBuffer = Buffer.isBuffer(source);
  const isStream = source instanceof Readable;

  if (!isString && !isBuffer && !isStream) {
    throw new ValidationError(
      'Upload source must be a string (path), Buffer, or Readable stream'
    );
  }

  if (isString && source.trim().length === 0) {
    throw new ValidationError('File path cannot be empty');
  }
}

// #endregion

// #region Normalization Utilities

/**
 * Normaliza opciones de upload con valores por defecto.
 * 
 * @param options - Opciones del usuario (parciales)
 * @param globalDefaults - Defaults globales desde config
 * @returns Opciones normalizadas
 */
export function normalizeUploadOptions(
  options?: Partial<UploadOptions>,
  globalDefaults?: { folder?: string; timeoutMs?: number }
): UploadOptions {
  return {
    folder: options?.folder || globalDefaults?.folder,
    publicId: options?.publicId,
    overwrite: options?.overwrite ?? false,
    tags: options?.tags || [],
    resourceType: options?.resourceType || 'auto',
    eager: options?.eager,
    timeoutMs: options?.timeoutMs || globalDefaults?.timeoutMs || 60000,
    context: options?.context,
    invalidate: options?.invalidate ?? false,
  };
}

/**
 * Construye el public ID completo incluyendo folder.
 * 
 * @param folder - Carpeta destino (opcional)
 * @param publicId - Public ID del archivo (opcional)
 * @returns Public ID completo o undefined
 * 
 * @example
 * buildPublicId('avatars', 'user123') // 'avatars/user123'
 * buildPublicId(undefined, 'user123')  // 'user123'
 * buildPublicId('avatars', undefined)  // undefined
 */
export function buildPublicId(
  folder?: string,
  publicId?: string
): string | undefined {
  if (!publicId) {
    return undefined;
  }

  if (!folder) {
    return publicId;
  }

  // Asegurar que folder no termine en / y publicId no empiece en /
  const cleanFolder = folder.replace(/\/$/, '');
  const cleanPublicId = publicId.replace(/^\//, '');

  return `${cleanFolder}/${cleanPublicId}`;
}

// #endregion

// #region Response Parsing

/**
 * Parsea la respuesta raw del SDK de Cloudinary a nuestro formato.
 * 
 * @param rawResponse - Respuesta del SDK
 * @returns Resultado parseado y tipado
 */
export function parseUploadResponse(rawResponse: any): UploadResult {
  return {
    publicId: rawResponse.public_id,
    version: rawResponse.version,
    url: rawResponse.url,
    secureUrl: rawResponse.secure_url,
    format: rawResponse.format,
    resourceType: rawResponse.resource_type,
    bytes: rawResponse.bytes,
    width: rawResponse.width,
    height: rawResponse.height,
    createdAt: rawResponse.created_at,
    folder: rawResponse.folder,
    tags: rawResponse.tags,
    raw: rawResponse,
  };
}

// #endregion

// #region Stream Utilities

/**
 * Convierte un Readable stream a Buffer.
 * Útil cuando el SDK no soporta streams directamente.
 * 
 * @param stream - Stream a convertir
 * @returns Promise que resuelve con el Buffer
 * 
 * @example
 * const buffer = await streamToBuffer(fs.createReadStream('file.jpg'));
 */
export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

// #endregion

// #region Resource Type Detection

/**
 * Intenta detectar el tipo de recurso basado en la fuente.
 * 
 * @param source - Fuente del archivo
 * @returns Tipo de recurso detectado o 'auto'
 */
export function detectResourceType(source: UploadSource): ResourceType {
  // Si es string (path), revisar extensión
  if (typeof source === 'string') {
    const ext = source.split('.').pop()?.toLowerCase();

    if (!ext) return 'auto';

    // Imágenes
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image';
    }

    // Videos
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'].includes(ext)) {
      return 'video';
    }

    // Raw (documentos, etc.)
    if (['pdf', 'doc', 'docx', 'txt', 'csv', 'json'].includes(ext)) {
      return 'raw';
    }
  }

  // Default: auto-detect
  return 'auto';
}

// #endregion

// #region Folder Utilities

/**
 * Normaliza un nombre de carpeta.
 * Remueve slashes innecesarios y caracteres inválidos.
 * 
 * @param folder - Nombre de carpeta
 * @returns Nombre normalizado
 */
export function normalizeFolderName(folder: string): string {
  return folder
    .replace(/^\/+/, '') // Remover / al inicio
    .replace(/\/+$/, '') // Remover / al final
    .replace(/\/+/g, '/') // Reemplazar múltiples / por uno solo
    .trim();
}

// #endregion