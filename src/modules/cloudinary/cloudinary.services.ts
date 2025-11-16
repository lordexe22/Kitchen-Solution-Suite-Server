// src/modules/cloudinary/cloudinary.services.ts

import { getCloudinaryClient, loadConfig } from './cloudinary.config';
import type {
  UploadSource,
  UploadOptions,
  UploadResult,
  MultipleUploadResult,
  DeleteOptions,
  DeleteResult,
  ListOptions,
  ListResult,
  GetInfoOptions,
} from './cloudinary.types';
import {
  validatePublicId,
  validateUploadSource,
  normalizeUploadOptions,
  buildPublicId,
  parseUploadResponse,
  streamToBuffer,
  normalizeFolderName,
} from './cloudinary.utils';
import {
  UploadError,
  DeleteError,
  NotFoundError,
  ValidationError,
  NetworkError,
} from './cloudinary.errors';
import { Readable } from 'stream';

// #region Upload Single File

/**
 * Sube un archivo a Cloudinary.
 * 
 * @param source - Archivo a subir (path, Buffer, o Stream)
 * @param options - Opciones de upload
 * @returns Resultado del upload con URLs y metadata
 * @throws {ValidationError} Si los parámetros son inválidos
 * @throws {UploadError} Si falla el upload
 * 
 * @example
 * // Desde path
 * const result = await uploadFile('./photo.jpg', { folder: 'avatars' });
 * 
 * // Desde Buffer
 * const buffer = fs.readFileSync('./photo.jpg');
 * const result = await uploadFile(buffer, { folder: 'avatars' });
 * 
 * // Con sobrescritura
 * const result = await uploadFile('./photo.jpg', {
 *   folder: 'avatars',
 *   publicId: 'user123',
 *   overwrite: true
 * });
 */
export async function uploadFile(
  source: UploadSource,
  options?: UploadOptions
): Promise<UploadResult> {
  // Validar entrada
  validateUploadSource(source);

  try {
    const client = getCloudinaryClient();
    const config = loadConfig();
    const normalizedOptions = normalizeUploadOptions(options, {
      folder: config.defaultFolder,
      timeoutMs: config.timeoutMs,
    });

    // Construir public_id completo si se especificó
    const fullPublicId = buildPublicId(
      normalizedOptions.folder,
      normalizedOptions.publicId
    );

    // Preparar parámetros para el SDK
    const uploadParams: any = {
      folder: normalizedOptions.folder,
      public_id: normalizedOptions.publicId, // Sin incluir folder aquí
      overwrite: normalizedOptions.overwrite,
      tags: normalizedOptions.tags,
      resource_type: normalizedOptions.resourceType,
      timeout: normalizedOptions.timeoutMs,
      context: normalizedOptions.context,
      invalidate: normalizedOptions.invalidate,
    };

    // Si hay transformaciones eager, agregarlas
    if (normalizedOptions.eager && normalizedOptions.eager.length > 0) {
      uploadParams.eager = normalizedOptions.eager;
    }

    // Determinar cómo subir según el tipo de source
    let rawResponse: any;

    if (typeof source === 'string') {
      // Upload desde path (string)
      rawResponse = await client.uploader.upload(source, uploadParams);
    } else if (Buffer.isBuffer(source)) {
      // Upload desde Buffer
      rawResponse = await uploadFromBuffer(client, source, uploadParams);
    } else if (source instanceof Readable) {
      // Upload desde Stream (convertir a Buffer primero)
      const buffer = await streamToBuffer(source);
      rawResponse = await uploadFromBuffer(client, buffer, uploadParams);
    } else {
      throw new ValidationError('Invalid source type');
    }

    // Parsear y retornar resultado
    return parseUploadResponse(rawResponse);
  } catch (error) {
    throw wrapUploadError(error, { source, options });
  }
}

/**
 * Helper para subir desde Buffer.
 * El SDK requiere base64 data URI para buffers.
 */
async function uploadFromBuffer(
  client: any,
  buffer: Buffer,
  params: any
): Promise<any> {
  // Convertir buffer a base64 data URI
  const base64 = buffer.toString('base64');
  const dataUri = `data:application/octet-stream;base64,${base64}`;
  
  return client.uploader.upload(dataUri, params);
}

// #endregion

// #region Upload Multiple Files

/**
 * Sube múltiples archivos a Cloudinary con control de concurrencia.
 * 
 * @param sources - Array de archivos a subir
 * @param options - Opciones de upload (se aplican a todos)
 * @returns Resultado con uploads exitosos y fallidos
 * 
 * @example
 * const files = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
 * const result = await uploadMultiple(files, {
 *   folder: 'gallery',
 *   concurrency: 3
 * });
 * 
 * console.log(`Exitosos: ${result.successCount}`);
 * console.log(`Fallidos: ${result.failureCount}`);
 */
export async function uploadMultiple(
  sources: UploadSource[],
  options?: UploadOptions & { concurrency?: number }
): Promise<MultipleUploadResult> {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new ValidationError('Sources must be a non-empty array');
  }

  const config = loadConfig();
  const concurrency = options?.concurrency || config.maxConcurrency || 3;

  const successful: UploadResult[] = [];
  const failed: Array<{ source: UploadSource; error: Error }> = [];

  // Procesar en batches según concurrencia
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map((source) => uploadFile(source, options))
    );

    results.forEach((result, index) => {
      const source = batch[index];

      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          source,
          error: result.reason,
        });
      }
    });
  }

  return {
    successful,
    failed,
    total: sources.length,
    successCount: successful.length,
    failureCount: failed.length,
  };
}

// #endregion

// #region Delete File

/**
 * Elimina un archivo de Cloudinary.
 * 
 * @param publicId - Public ID del archivo a eliminar
 * @param options - Opciones de eliminación
 * @returns Resultado de la eliminación
 * @throws {ValidationError} Si el publicId es inválido
 * @throws {DeleteError} Si falla la eliminación
 * @throws {NotFoundError} Si el archivo no existe
 * 
 * @example
 * await deleteFile('avatars/user123');
 * await deleteFile('video123', { resourceType: 'video' });
 */
export async function deleteFile(
  publicId: string,
  options?: DeleteOptions
): Promise<DeleteResult> {
  validatePublicId(publicId);

  try {
    const client = getCloudinaryClient();

    const result = await client.uploader.destroy(publicId, {
      resource_type: options?.resourceType || 'image',
      invalidate: options?.invalidate ?? false,
    });

    // El SDK retorna { result: 'ok' } o { result: 'not found' }
    if (result.result === 'not found') {
      throw new NotFoundError(publicId, options?.resourceType || 'image');
    }

    return {
      publicId,
      result: 'ok',
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw wrapDeleteError(error, { publicId, options });
  }
}

// #endregion

// #region Get File Info

/**
 * Obtiene información detallada de un archivo.
 * 
 * @param publicId - Public ID del archivo
 * @param options - Opciones para obtener info adicional
 * @returns Información del archivo
 * @throws {ValidationError} Si el publicId es inválido
 * @throws {NotFoundError} Si el archivo no existe
 * 
 * @example
 * const info = await getFileInfo('avatars/user123');
 * console.log(info.url, info.bytes, info.format);
 */
export async function getFileInfo(
  publicId: string,
  options?: GetInfoOptions
): Promise<UploadResult> {
  validatePublicId(publicId);

  try {
    const client = getCloudinaryClient();

    const result = await client.api.resource(publicId, {
      resource_type: options?.resourceType || 'image',
      colors: options?.colors ?? false,
      faces: options?.faces ?? false,
      exif: options?.exif ?? false,
    });

    return parseUploadResponse(result);
  } catch (error: any) {
    // El SDK lanza error con http_code 404 cuando no existe
    if (error.error?.http_code === 404) {
      throw new NotFoundError(publicId, options?.resourceType || 'image');
    }

    throw new UploadError(
      `Failed to get file info: ${error.message}`,
      { publicId, options },
      error
    );
  }
}

// #endregion

// #region List Files

/**
 * Lista archivos de una carpeta o con filtros.
 * 
 * @param options - Opciones de filtrado y paginación
 * @returns Lista de archivos y cursor para paginación
 * 
 * @example
 * // Listar carpeta específica
 * const result = await listFiles({ folder: 'avatars', maxResults: 20 });
 * 
 * // Paginación
 * const page1 = await listFiles({ folder: 'avatars' });
 * const page2 = await listFiles({ folder: 'avatars', nextCursor: page1.nextCursor });
 * 
 * // Con filtros
 * const result = await listFiles({
 *   folder: 'products',
 *   prefix: 'prod-',
 *   sortBy: 'created_at',
 *   sortDirection: 'desc'
 * });
 */
export async function listFiles(
  options?: ListOptions
): Promise<ListResult> {
  try {
    const client = getCloudinaryClient();

    const searchParams: any = {
      type: 'upload',
      max_results: Math.min(options?.maxResults || 10, 500),
      resource_type: options?.resourceType || 'image',
    };

    // Agregar carpeta si se especifica
    if (options?.folder) {
      searchParams.prefix = normalizeFolderName(options.folder);
    } else if (options?.prefix) {
      searchParams.prefix = options.prefix;
    }

    // Paginación
    if (options?.nextCursor) {
      searchParams.next_cursor = options.nextCursor;
    }

    const result = await client.api.resources(searchParams);

    return {
      resources: result.resources.map(parseUploadResponse),
      nextCursor: result.next_cursor,
      totalCount: result.total_count || result.resources.length,
    };
  } catch (error: any) {
    throw new UploadError(
      `Failed to list files: ${error.message}`,
      { options },
      error
    );
  }
}

// #endregion

// #region Error Wrapping Utilities

/**
 * Envuelve errores de upload del SDK en nuestro error custom.
 */
function wrapUploadError(error: any, metadata?: Record<string, unknown>): Error {
  if (error instanceof ValidationError) {
    return error;
  }

  // Detectar errores de red/timeout
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    return new NetworkError(
      `Network error during upload: ${error.message}`,
      metadata,
      error
    );
  }

  return new UploadError(
    error.message || 'Upload failed',
    metadata,
    error
  );
}

/**
 * Envuelve errores de delete del SDK.
 */
function wrapDeleteError(error: any, metadata?: Record<string, unknown>): Error {
  if (error instanceof NotFoundError) {
    return error;
  }

  return new DeleteError(
    error.message || 'Delete failed',
    metadata,
    error
  );
}

// #endregion