/**
 * FILE UPLOAD MIDDLEWARE
 *
 * Configuración de multer para manejo de archivos subidos vía multipart/form-data.
 * Usa memoryStorage (archivos en buffer, no en disco).
 *
 * Exports:
 * - uploadSingleFile(fieldName) — middleware multer para un solo archivo
 * - uploadExcelFile(fieldName) — middleware multer para archivos .xlsx
 * - validateFileExists — verifica que req.file exista
 * - handleFileUploadError — manejador de errores de multer
 */

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// --- Storage ---
const storage = multer.memoryStorage();

// --- Limits ---
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const EXCEL_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// --- File Filters ---

const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_MIMETYPES.join(', ')}`));
  }
};

const ALLOWED_EXCEL_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const excelFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_EXCEL_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only .xlsx files are allowed'));
  }
};

// --- Multer Instances ---

const uploadImage = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_SIZE },
  fileFilter: imageFileFilter,
});

const uploadExcel = multer({
  storage,
  limits: { fileSize: EXCEL_MAX_SIZE },
  fileFilter: excelFileFilter,
});

// --- Exports ---

/**
 * Middleware multer para subir una sola imagen.
 * @param fieldName Nombre del campo en el form (default: 'file')
 */
export const uploadSingleFile = (fieldName: string = 'file') => {
  return uploadImage.single(fieldName);
};

/**
 * Middleware multer para subir un solo archivo Excel.
 * @param fieldName Nombre del campo en el form (default: 'file')
 */
export const uploadExcelFile = (fieldName: string = 'file') => {
  return uploadExcel.single(fieldName);
};

/**
 * Middleware que valida que un archivo fue subido correctamente.
 * Debe ir DESPUÉS de uploadSingleFile/uploadExcelFile en la cadena.
 */
export const validateFileExists = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  next();
};

/**
 * Error handler para errores de multer.
 * Debe ir AL FINAL de la cadena de middlewares de upload.
 */
export const handleFileUploadError = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ success: false, error: 'Unexpected field name' });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if (err) {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  next();
};
