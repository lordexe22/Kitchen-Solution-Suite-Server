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
// #end-section

// #middleware createCompanyMiddleware
/**
 * Middleware para crear una nueva compañía
 * POST /api/dashboard/company
 * Body: { name: string, description?: string, logoUrl?: string }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware getAllCompaniesMiddleware
/**
 * Middleware para obtener todas las compañías del usuario
 * GET /api/dashboard/company?state=active&page=1&limit=10
 * Query: { state?: 'active' | 'archived', page?: number, limit?: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware getCompanyMiddleware
/**
 * Middleware para obtener una compañía específica
 * GET /api/dashboard/company/:id
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware updateCompanyMiddleware
/**
 * Middleware para actualizar una compañía
 * PATCH /api/dashboard/company/:id
 * Params: { id: number }
 * Body: { name?: string, description?: string, logoUrl?: string }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware deleteCompanyMiddleware
/**
 * Middleware para eliminar una compañía
 * DELETE /api/dashboard/company/:id
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware archiveCompanyMiddleware
/**
 * Middleware para archivar una compañía
 * POST /api/dashboard/company/:id/archive
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware reactivateCompanyMiddleware
/**
 * Middleware para reactivar una compañía archivada
 * POST /api/dashboard/company/:id/reactivate
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware checkNameAvailabilityMiddleware
/**
 * Middleware para verificar disponibilidad de nombre
 * GET /api/company/check-name?name=MyCompany
 * Query: { name: string }
 * Headers: No requiere autenticación (es público para UX)
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
// #middleware checkCompanyPermissionMiddleware
/**
 * Middleware para verificar permisos de usuario sobre una compañía
 * GET /api/dashboard/company/:id/permission
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
// #middleware uploadCompanyLogoMiddleware
/**
 * Middleware para subir/reemplazar el logo de una compañía
 * POST /api/dashboard/company/:id/logo
 * Params: { id: number }
 * Body: multipart/form-data con campo 'logo' (imagen, max 5MB)
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
 * Prerequisitos en la cadena: uploadSingleFile('logo'), validateFileExists
 */
export const uploadCompanyLogoMiddleware = async (
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
};
// #end-middleware
// #middleware deleteCompanyLogoMiddleware
/**
 * Middleware para eliminar el logo de una compañía
 * DELETE /api/dashboard/company/:id/logo
 * Params: { id: number }
 * Headers: Requiere autenticación JWT (validado por validateJWTMiddleware)
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
