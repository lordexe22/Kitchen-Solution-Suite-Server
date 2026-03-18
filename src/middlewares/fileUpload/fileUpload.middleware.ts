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

// #function uploadSingleFile - Retorna un middleware multer configurado para subir una sola imagen
/**
 * @description Función de fábrica que crea un middleware de multer para subir una imagen.
 * @purpose Encapsular la configuración de multer permitiendo especificar el nombre del campo del form.
 * @context Utilizado en las rutas que requieren subida de imágenes como avatar o logo de compañía.
 * @param fieldName nombre del campo en el formulario multipart (default: 'file')
 * @returns middleware de multer configurado para procesar el archivo del campo especificado
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const uploadSingleFile = (fieldName: string = 'file') => {
  return uploadImage.single(fieldName);
};
// #end-function

// #function uploadExcelFile - Retorna un middleware multer configurado para subir un archivo Excel
/**
 * @description Función de fábrica que crea un middleware de multer para subir un archivo .xlsx.
 * @purpose Encapsular la configuración de multer con validación de tipo Excel y tamaño máximo.
 * @context Utilizado en rutas de importación de datos que reciben archivos Excel.
 * @param fieldName nombre del campo en el formulario multipart (default: 'file')
 * @returns middleware de multer configurado para procesar archivos .xlsx
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const uploadExcelFile = (fieldName: string = 'file') => {
  return uploadExcel.single(fieldName);
};
// #end-function

// #middleware validateFileExists - Verifica que un archivo fue subido correctamente en la petición
/**
 * @description Middleware que valida que req.file esté presente tras el procesamiento de multer.
 * @purpose Garantizar que el archivo requerido existe antes de que los handlers posteriores lo procesen.
 * @context Utilizado después de uploadSingleFile o uploadExcelFile en la cadena de middlewares.
 * @param req petición HTTP tras el procesamiento de multer
 * @param res respuesta HTTP
 * @param next función de Express para continuar si el archivo existe
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const validateFileExists = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  next();
};
// #end-middleware

// #middleware handleFileUploadError - Maneja errores de multer devolviendo respuestas HTTP apropiadas
/**
 * @description Middleware de manejo de errores que intercepta y procesa los errores lanzados por multer.
 * @purpose Proporcionar respuestas de error estructuradas ante fallos en la subida de archivos.
 * @context Debe ubicarse al final de la cadena de middlewares de upload para capturar errores de multer.
 * @param err error capturado, puede ser un MulterError u otro tipo de error
 * @param _req petición HTTP (no utilizada en el error handler)
 * @param res respuesta HTTP donde se envía el mensaje de error
 * @param next función de Express para continuar si no hay error
 * @since 1.0.0
 * @author Walter Ezequiel Puig
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
// #end-middleware
