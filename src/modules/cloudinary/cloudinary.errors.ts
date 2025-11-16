// src/modules/cloudinary/cloudinary.errors.ts

/**
 * Errores custom para el módulo de Cloudinary.
 * Todos heredan de CloudinaryError para facilitar manejo.
 */

// #region Base Error

/**
 * Error base del módulo de Cloudinary.
 * Todos los errores específicos heredan de esta clase.
 */
export class CloudinaryError extends Error {
  /**
   * Código de error para identificación programática.
   */
  public readonly code: string;

  /**
   * Metadata adicional del error.
   */
  public readonly metadata?: Record<string, unknown>;

  /**
   * Error original si este error envuelve otro.
   */
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    metadata?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'CloudinaryError';
    this.code = code;
    this.metadata = metadata;
    this.originalError = originalError;

    // Mantener stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// #endregion

// #region Validation Errors

/**
 * Error de validación de parámetros de entrada.
 */
export class ValidationError extends CloudinaryError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', metadata);
    this.name = 'ValidationError';
  }
}

// #endregion

// #region Configuration Errors

/**
 * Error de configuración (credenciales faltantes, inválidas, etc.)
 */
export class ConfigurationError extends CloudinaryError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'CONFIGURATION_ERROR', metadata);
    this.name = 'ConfigurationError';
  }
}

// #endregion

// #region Upload Errors

/**
 * Error durante operación de upload.
 */
export class UploadError extends CloudinaryError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message, 'UPLOAD_ERROR', metadata, originalError);
    this.name = 'UploadError';
  }
}

// #endregion

// #region Delete Errors

/**
 * Error durante operación de eliminación.
 */
export class DeleteError extends CloudinaryError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message, 'DELETE_ERROR', metadata, originalError);
    this.name = 'DeleteError';
  }
}

// #endregion

// #region Not Found Errors

/**
 * Error cuando un recurso no existe.
 */
export class NotFoundError extends CloudinaryError {
  constructor(
    publicId: string,
    resourceType: string = 'image'
  ) {
    super(
      `Resource not found: ${publicId}`,
      'NOT_FOUND',
      { publicId, resourceType }
    );
    this.name = 'NotFoundError';
  }
}

// #endregion

// #region Network Errors

/**
 * Error de red o timeout.
 */
export class NetworkError extends CloudinaryError {
  constructor(
    message: string,
    metadata?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR', metadata, originalError);
    this.name = 'NetworkError';
  }
}

// #endregion

// #region Rate Limit Errors

/**
 * Error cuando se excede el límite de requests.
 */
export class RateLimitError extends CloudinaryError {
  constructor(
    message: string = 'Rate limit exceeded',
    metadata?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_ERROR', metadata);
    this.name = 'RateLimitError';
  }
}

// #endregion