// src/modules/cloudinary/cloudinary.types.ts

/**
 * Tipos para el módulo de Cloudinary.
 * Define contratos y estructuras de datos.
 */

// #region Configuration Types

/**
 * Configuración del cliente de Cloudinary.
 * Se carga desde variables de entorno o se puede inyectar.
 */
export interface CloudinaryConfig {
  /** Nombre del cloud de Cloudinary */
  cloudName: string;
  /** API Key */
  apiKey: string;
  /** API Secret */
  apiSecret: string;
  /** Usar HTTPS (default: true) */
  secure?: boolean;
  /** Carpeta por defecto para uploads */
  defaultFolder?: string;
  /** Upload preset (para unsigned uploads) */
  uploadPreset?: string;
  /** Timeout en milisegundos (default: 60000) */
  timeoutMs?: number;
  /** Máxima concurrencia para uploads múltiples (default: 3) */
  maxConcurrency?: number;
}

// #endregion

// #region Upload Types

/**
 * Fuente de archivo para upload.
 * Puede ser: path local, Buffer en memoria, o Stream.
 */
export type UploadSource = string | Buffer | NodeJS.ReadableStream;

/**
 * Tipo de recurso en Cloudinary.
 */
export type ResourceType = 'image' | 'video' | 'raw' | 'auto';

/**
 * Opciones para subir un archivo.
 */
export interface UploadOptions {
  /** Carpeta destino en Cloudinary */
  folder?: string;
  /** Public ID custom (nombre del archivo en Cloudinary) */
  publicId?: string;
  /** Sobrescribir si ya existe (default: false) */
  overwrite?: boolean;
  /** Tags para clasificar el archivo */
  tags?: string[];
  /** Tipo de recurso (default: 'auto') */
  resourceType?: ResourceType;
  /** Transformaciones eager (aplicar al subir) */
  eager?: Array<Record<string, unknown>>;
  /** Timeout custom para esta operación (ms) */
  timeoutMs?: number;
  /** Context metadata adicional */
  context?: Record<string, string>;
  /** Invalidar CDN cache (default: false) */
  invalidate?: boolean;
}

/**
 * Resultado de un upload exitoso.
 */
export interface UploadResult {
  /** Public ID del archivo en Cloudinary */
  publicId: string;
  /** Versión del archivo */
  version: number;
  /** URL pública del archivo */
  url: string;
  /** URL segura (HTTPS) del archivo */
  secureUrl: string;
  /** Formato del archivo (jpg, png, mp4, etc.) */
  format: string;
  /** Tipo de recurso */
  resourceType: string;
  /** Tamaño en bytes */
  bytes: number;
  /** Ancho (si es imagen/video) */
  width?: number;
  /** Alto (si es imagen/video) */
  height?: number;
  /** Fecha de creación */
  createdAt: string;
  /** Carpeta donde está almacenado */
  folder?: string;
  /** Tags asignados */
  tags?: string[];
  /** Respuesta raw del SDK (por si se necesita algo específico) */
  raw?: unknown;
}

/**
 * Resultado de uploads múltiples.
 * Incluye éxitos y errores parciales.
 */
export interface MultipleUploadResult {
  /** Uploads exitosos */
  successful: UploadResult[];
  /** Uploads fallidos con sus errores */
  failed: Array<{
    source: UploadSource;
    error: Error;
  }>;
  /** Total de archivos procesados */
  total: number;
  /** Cantidad exitosa */
  successCount: number;
  /** Cantidad fallida */
  failureCount: number;
}

// #endregion

// #region Delete Types

/**
 * Opciones para eliminar archivos.
 */
export interface DeleteOptions {
  /** Tipo de recurso a eliminar */
  resourceType?: ResourceType;
  /** Invalidar CDN cache (default: false) */
  invalidate?: boolean;
}

/**
 * Resultado de eliminación de archivo.
 */
export interface DeleteResult {
  /** Public ID del archivo eliminado */
  publicId: string;
  /** Resultado de la operación */
  result: 'ok' | 'not found';
}

// #endregion

// #region List Types

/**
 * Opciones para listar archivos.
 */
export interface ListOptions {
  /** Carpeta a listar */
  folder?: string;
  /** Prefijo del public ID */
  prefix?: string;
  /** Tipo de recurso */
  resourceType?: ResourceType;
  /** Máximo de resultados (default: 10, max: 500) */
  maxResults?: number;
  /** Cursor para paginación */
  nextCursor?: string;
  /** Ordenar por campo */
  sortBy?: 'created_at' | 'public_id' | 'uploaded_at';
  /** Dirección del ordenamiento */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado de listar archivos.
 */
export interface ListResult {
  /** Lista de recursos encontrados */
  resources: UploadResult[];
  /** Cursor para siguiente página (si hay más resultados) */
  nextCursor?: string;
  /** Total de recursos encontrados */
  totalCount: number;
}

// #endregion

// #region Info Types

/**
 * Opciones para obtener info de un archivo.
 */
export interface GetInfoOptions {
  /** Tipo de recurso */
  resourceType?: ResourceType;
  /** Incluir colores predominantes (solo imágenes) */
  colors?: boolean;
  /** Incluir análisis de caras (solo imágenes) */
  faces?: boolean;
  /** Incluir metadata EXIF (solo imágenes) */
  exif?: boolean;
}

// #endregion