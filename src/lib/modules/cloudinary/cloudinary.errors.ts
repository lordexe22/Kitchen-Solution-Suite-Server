// cloudinary.errors.ts
/* #info - Error classes for Cloudinary module */
// #section Classes

// #class CloudinaryError
/**
 * Error base del módulo Cloudinary.
 * @version 1.0.0
 */
export class CloudinaryError extends Error {
	public readonly code: string;
	public readonly metadata?: Record<string, unknown>;
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

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
// #end-class

// #class ValidationError
/**
 * Error de validación de parámetros.
 * @version 1.0.0
 */
export class ValidationError extends CloudinaryError {
	constructor(message: string, metadata?: Record<string, unknown>) {
		super(message, 'VALIDATION_ERROR', metadata);
		this.name = 'ValidationError';
	}
}
// #end-class

// #class ConfigurationError
/**
 * Error de configuración (credenciales faltantes, etc.).
 * @version 1.0.0
 */
export class ConfigurationError extends CloudinaryError {
	constructor(message: string, metadata?: Record<string, unknown>) {
		super(message, 'CONFIGURATION_ERROR', metadata);
		this.name = 'ConfigurationError';
	}
}
// #end-class

// #class UploadError
/**
 * Error durante el upload a Cloudinary.
 * @version 1.0.0
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
// #end-class

// #class ReplaceImageError
/**
 * Error específico durante replaceImage.
 * @version 1.0.0
 */
export class ReplaceImageError extends CloudinaryError {
	constructor(
		message: string,
		metadata?: Record<string, unknown>,
		originalError?: Error
	) {
		super(message, 'REPLACE_IMAGE_ERROR', metadata, originalError);
		this.name = 'ReplaceImageError';
	}
}
// #end-class

// #class FetchImageError
/**
 * Error específico durante getImage.
 * @version 1.0.0
 */
export class FetchImageError extends CloudinaryError {
	constructor(
		message: string,
		metadata?: Record<string, unknown>,
		originalError?: Error
	) {
		super(message, 'FETCH_IMAGE_ERROR', metadata, originalError);
		this.name = 'FetchImageError';
	}
}
// #end-class

// #class RenameImageError
/**
 * Error específico durante renameImage.
 * @version 1.0.0
 */
export class RenameImageError extends CloudinaryError {
	constructor(
		message: string,
		metadata?: Record<string, unknown>,
		originalError?: Error
	) {
		super(message, 'RENAME_IMAGE_ERROR', metadata, originalError);
		this.name = 'RenameImageError';
	}
}
// #end-class

// #class MoveImageError
/**
 * Error específico durante moveImage.
 * @version 1.0.0
 */
export class MoveImageError extends CloudinaryError {
	constructor(
		message: string,
		metadata?: Record<string, unknown>,
		originalError?: Error
	) {
		super(message, 'MOVE_IMAGE_ERROR', metadata, originalError);
		this.name = 'MoveImageError';
	}
}
// #end-class

// #class DeleteError
/**
 * Error durante la eliminación en Cloudinary.
 * @version 1.0.0
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
// #end-class

// #class NotFoundError
/**
 * Error cuando el recurso no existe en Cloudinary.
 * @version 1.0.0
 */
export class NotFoundError extends CloudinaryError {
	constructor(publicId: string) {
		super(`Resource not found: ${publicId}`, 'NOT_FOUND', { publicId });
		this.name = 'NotFoundError';
	}
}
// #end-class
// #end-section
