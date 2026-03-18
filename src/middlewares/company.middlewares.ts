// src/middlewares/company.middlewares.ts

/**
 * MIDDLEWARES DE COMPAÑÍAS
 * 
 * Estos middlewares orquestan los servicios de compañías
 * y manejan las operaciones HTTP (request/response).
 * 
 * La lógica de negocio reside en los servicios (services/company/).
 */

// #section Imports
import { Request, Response, NextFunction } from 'express';
import { createCompanyService } from '../services/company/createCompany/createCompany.service';
import { getAllCompaniesService } from '../services/company/getAllCompanies/getAllCompanies.service';
import { getCompanyService } from '../services/company/getCompany/getCompany.service';
import { updateCompanyService } from '../services/company/updateCompany/updateCompany.service';
import { deleteCompanyService } from '../services/company/deleteCompany/deleteCompany.service';
import { archiveCompanyService } from '../services/company/archiveCompany/archiveCompany.service';
import { reactivateCompanyService } from '../services/company/reactivateCompany/reactivateCompany.service';
import { checkNameAvailability } from '../services/company/checkNameAvailability/checkNameAvailability.service';
import { checkCompanyPermissionService } from '../services/company/checkCompanyPermission/checkCompanyPermission.service';
import type { AuthenticatedRequest } from './validators/validateJWT.types';
import { uploadSingleFile } from '../middlewares/fileUpload/fileUpload.middleware';
// #end-section

// #middleware createCompanyMiddleware - Crea una nueva compañía asociada al usuario autenticado
/**
 * @description Middleware que procesa la creación de una nueva compañía.
 * @purpose Orquestar el servicio de creación de compañías y manejar la respuesta HTTP.
 * @context Utilizado en la ruta POST /api/dashboard/company como handler principal.
 * @param req petición con los datos de la compañía en el body y opcionalmente el logo como archivo
 * @param res respuesta HTTP con la compañía recién creada
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const createCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const input = { ...req.body, ...(req.file ? { logo: req.file.buffer } : {}) };

    const company = await createCompanyService(input, userId);
    res.status(201).json({ data: company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create company';
    res.status(400).json({ error: message });
  }
};
// #end-middleware
// #middleware getAllCompaniesMiddleware - Obtiene todas las compañías del usuario con filtrado y paginación
/**
 * @description Middleware que procesa la obtención de todas las compañías del usuario autenticado.
 * @purpose Orquestar el servicio de listado de compañías con soporte para filtros y paginación.
 * @context Utilizado en la ruta GET /api/dashboard/company como handler principal.
 * @param req petición con parámetros opcionales de filtrado por estado y paginación en query
 * @param res respuesta HTTP con la lista de compañías y metadatos de paginación
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getAllCompaniesMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const options = {
      state: req.query.state as 'active' | 'archived' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await getAllCompaniesService(userId, options);
    res.status(200).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get companies';
    res.status(400).json({ error: message });
  }
};
// #end-middleware
// #middleware getCompanyMiddleware - Obtiene una compañía específica del usuario autenticado
/**
 * @description Middleware que procesa la obtención de una compañía individual por su ID.
 * @purpose Orquestar el servicio de consulta de compañía validando que pertenezca al usuario.
 * @context Utilizado en la ruta GET /api/dashboard/company/:id como handler principal.
 * @param req petición con el ID de la compañía en los parámetros de ruta
 * @param res respuesta HTTP con los datos de la compañía solicitada
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const getCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    const company = await getCompanyService(companyId, userId);
    res.status(200).json({ data: company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get company';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
// #middleware updateCompanyMiddleware - Actualiza los datos de una compañía existente
/**
 * @description Middleware que procesa la actualización parcial de una compañía.
 * @purpose Orquestar el servicio de actualización de compañías y manejar la respuesta HTTP.
 * @context Utilizado en la ruta PATCH /api/dashboard/company/:id como handler principal.
 * @param req petición con el ID en ruta y los campos a actualizar en el body
 * @param res respuesta HTTP con la compañía actualizada
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const updateCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);
    const input = { ...req.body, ...(req.file ? { logo: req.file.buffer } : {}) };

    const company = await updateCompanyService(companyId, userId, input);
    res.status(200).json({ data: company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('taken') ? 409 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
// #middleware deleteCompanyMiddleware - Elimina permanentemente una compañía del usuario autenticado
/**
 * @description Middleware que procesa la eliminación definitiva de una compañía.
 * @purpose Orquestar el servicio de eliminación de compañías y manejar la respuesta HTTP.
 * @context Utilizado en la ruta DELETE /api/dashboard/company/:id como handler principal.
 * @param req petición con el ID de la compañía a eliminar en los parámetros de ruta
 * @param res respuesta HTTP confirmando la eliminación exitosa
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const deleteCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    await deleteCompanyService(companyId, userId);
    res.status(200).json({ data: { message: 'Company deleted successfully' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete company';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
// #middleware archiveCompanyMiddleware - Archiva una compañía ocultándola de las listas activas
/**
 * @description Middleware que procesa el archivado de una compañía sin eliminarla.
 * @purpose Orquestar el servicio de archivado de compañías y manejar la respuesta HTTP.
 * @context Utilizado en la ruta POST /api/dashboard/company/:id/archive como handler principal.
 * @param req petición con el ID de la compañía a archivar en los parámetros de ruta
 * @param res respuesta HTTP con la compañía archivada y el mensaje de confirmación
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const archiveCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    const company = await archiveCompanyService(companyId, userId);
    res.status(200).json({ data: { company, message: 'Company archived successfully' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to archive company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('already archived') ? 409 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
// #middleware reactivateCompanyMiddleware - Reactiva una compañía previamente archivada
/**
 * @description Middleware que procesa la reactivación de una compañía archivada.
 * @purpose Orquestar el servicio de reactivación de compañías y manejar la respuesta HTTP.
 * @context Utilizado en la ruta POST /api/dashboard/company/:id/reactivate como handler principal.
 * @param req petición con el ID de la compañía a reactivar en los parámetros de ruta
 * @param res respuesta HTTP con la compañía reactivada y el mensaje de confirmación
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const reactivateCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    const company = await reactivateCompanyService(companyId, userId);
    res.status(200).json({ data: { company, message: 'Company reactivated successfully' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reactivate company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('not archived') ? 409 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
// #middleware checkNameAvailabilityMiddleware - Verifica si un nombre de compañía está disponible
/**
 * @description Middleware que comprueba la disponibilidad de un nombre de compañía.
 * @purpose Orquestar el servicio de verificación de nombre y devolver el resultado al cliente.
 * @context Utilizado en la ruta GET /api/company/check-name como handler principal.
 * @param req petición con el nombre a verificar en el query string
 * @param res respuesta HTTP indicando si el nombre está disponible o no
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const checkNameAvailabilityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const name = req.query.name as string;
    
    if (!name) {
      res.status(400).json({ error: 'Company name is required' });
      return;
    }

    const isAvailable = await checkNameAvailability(name);
    res.status(200).json({ data: { available: isAvailable } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name availability';
    res.status(400).json({ error: message });
  }
};
// #end-middleware
// #middleware checkCompanyPermissionMiddleware - Verifica los permisos del usuario sobre una compañía
/**
 * @description Middleware que comprueba los permisos del usuario autenticado sobre una compañía específica.
 * @purpose Orquestar el servicio de verificación de permisos y devolver el resultado al cliente.
 * @context Utilizado en la ruta GET /api/dashboard/company/:id/permission como handler principal.
 * @param req petición con el ID de la compañía en los parámetros de ruta
 * @param res respuesta HTTP con los permisos disponibles del usuario sobre la compañía
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const checkCompanyPermissionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    const result = await checkCompanyPermissionService(companyId, userId);
    res.status(200).json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check permission';
    res.status(400).json({ error: message });
  }
};
// #end-middleware
// #middleware uploadCompanyLogoMiddleware - Sube o reemplaza el logo de una compañía
/**
 * @description Middleware compuesto que gestiona la subida del logo de una compañía.
 * @purpose Orquestar el procesamiento del archivo de imagen y su persistencia mediante el servicio de actualización.
 * @context Utilizado en la ruta POST /api/dashboard/company/:id/logo como array de middlewares.
 * @param req petición con el ID en ruta y el archivo de imagen en multipart/form-data
 * @param res respuesta HTTP con la compañía actualizada y mensaje de confirmación
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const uploadCompanyLogoMiddleware = [
  uploadSingleFile('logo'), // Middleware de multer para manejar el archivo
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user.id;
      const companyId = parseInt(req.params.id);

      const company = await updateCompanyService(companyId, userId, { logo: req.file!.buffer });
      res.status(200).json({
        data: {
          company,
          message: 'Logo uploaded successfully',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload logo';
      const status = message.includes('not found') ? 404 :
                     message.includes('denied') ? 403 : 400;
      res.status(status).json({ error: message });
    }
  },
];

// #end-middleware
// #middleware deleteCompanyLogoMiddleware - Elimina el logo de una compañía
/**
 * @description Middleware que procesa la eliminación del logo de una compañía.
 * @purpose Orquestar el servicio de eliminación del logo y manejar la respuesta HTTP.
 * @context Utilizado en la ruta DELETE /api/dashboard/company/:id/logo como handler principal.
 * @param req petición con el ID de la compañía en los parámetros de ruta
 * @param res respuesta HTTP con la compañía actualizada sin logo y el mensaje de confirmación
 * @param next función de Express para continuar la cadena de middlewares
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const deleteCompanyLogoMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const companyId = parseInt(req.params.id);

    const company = await updateCompanyService(companyId, userId, { logo: null });
    res.status(200).json({
      data: {
        company,
        message: 'Logo deleted successfully',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete logo';
    const status = message.includes('not found') ? 404 :
                   message.includes('denied') ? 403 :
                   message.includes('does not have a logo') ? 400 : 400;
    res.status(status).json({ error: message });
  }
};
// #end-middleware
