// src/middlewares/fileUpload/fileUpload.middlewares.ts

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

/**
 * Configuración de multer para almacenar archivos en memoria.
 * Los archivos se guardan como Buffer en req.file.buffer
 */
const storage = multer.memoryStorage();

/**
 * Límites de archivos.
 */
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB máximo
};

/**
 * Filtro de tipos de archivo permitidos.
 * Solo acepta imágenes.
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Tipos MIME permitidos
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`
      )
    );
  }
};

/**
 * Instancia de multer configurada.
 */
const upload = multer({
  storage,
  limits,
  fileFilter,
});

/**
 * Middleware para manejar upload de un solo archivo.
 * El archivo estará disponible en req.file
 * 
 * @param fieldName - Nombre del campo en el formulario (default: 'file')
 * 
 * @example
 * router.post('/upload', uploadSingleFile('logo'), uploadLogoMiddleware);
 */
export const uploadSingleFile = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

/**
 * Middleware para validar que se subió un archivo.
 * Debe usarse DESPUÉS de uploadSingleFile().
 * 
 * @example
 * router.post('/upload', uploadSingleFile('logo'), validateFileExists, uploadLogoMiddleware);
 */
export const validateFileExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
    return;
  }

  next();
};

/**
 * Middleware para manejar errores de multer.
 * Debe usarse como middleware de error en las rutas.
 * 
 * @example
 * router.post('/upload', uploadSingleFile('logo'), middleware, handleFileUploadError);
 */
export const handleFileUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    // Errores de multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB',
      });
      return;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: 'Unexpected field name',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Otros errores (ej: tipo de archivo inválido)
  if (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  next();
};