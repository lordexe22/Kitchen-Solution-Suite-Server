// src/modules/cloudinary/index.ts

/**
 * Módulo de Cloudinary - Punto de entrada público.
 * 
 * Este módulo proporciona funciones para interactuar con Cloudinary
 * de manera agnóstica al framework (sin dependencia de Express/Fastify/etc).
 * 
 * @example
 * import { uploadFile, deleteFile, listFiles } from '@/modules/cloudinary';
 * 
 * const result = await uploadFile('./photo.jpg', { folder: 'avatars' });
 * console.log(result.secureUrl);
 */

// #region Exports

// Servicios principales
export {
  uploadFile,
  uploadMultiple,
  deleteFile,
  getFileInfo,
  listFiles,
} from './cloudinary.services';

// Tipos
export type {
  CloudinaryConfig,
  UploadSource,
  UploadOptions,
  UploadResult,
  MultipleUploadResult,
  DeleteOptions,
  DeleteResult,
  ListOptions,
  ListResult,
  GetInfoOptions,
  ResourceType,
} from './cloudinary.types';

// Errores
export {
  CloudinaryError,
  ValidationError,
  ConfigurationError,
  UploadError,
  DeleteError,
  NotFoundError,
  NetworkError,
  RateLimitError,
} from './cloudinary.errors';

// Configuración (por si se necesita acceso directo)
export {
  loadConfig,
  getCloudinaryClient,
  resetCache,
} from './cloudinary.config';

// #endregion