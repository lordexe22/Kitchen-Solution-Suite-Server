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
// #end-section

// #middleware createCompanyMiddleware
/**
 * Middleware para crear una nueva compañía
 * POST /api/company
 * Body: { name: string, description?: string, logoUrl?: string }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const createCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || req.body.userId; // Temporal
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const company = await createCompanyService(req.body, userId);
    res.status(201).json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create company';
    res.status(400).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware getAllCompaniesMiddleware
/**
 * Middleware para obtener todas las compañías del usuario
 * GET /api/company?state=active&page=1&limit=10
 * Query: { state?: 'active' | 'archived', page?: number, limit?: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const getAllCompaniesMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || parseInt(req.query.userId as string); // Temporal
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const options = {
      state: req.query.state as 'active' | 'archived' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await getAllCompaniesService(userId, options);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get companies';
    res.status(400).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware getCompanyMiddleware
/**
 * Middleware para obtener una compañía específica
 * GET /api/company/:id
 * Params: { id: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const getCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || parseInt(req.query.userId as string); // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const company = await getCompanyService(companyId, userId);
    res.status(200).json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get company';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware updateCompanyMiddleware
/**
 * Middleware para actualizar una compañía
 * PATCH /api/company/:id
 * Params: { id: number }
 * Body: { name?: string, description?: string, logoUrl?: string }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const updateCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || req.body.userId; // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const company = await updateCompanyService(companyId, userId, req.body);
    res.status(200).json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('taken') ? 409 : 400;
    res.status(status).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware deleteCompanyMiddleware
/**
 * Middleware para eliminar una compañía
 * DELETE /api/company/:id
 * Params: { id: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const deleteCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || parseInt(req.query.userId as string); // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    await deleteCompanyService(companyId, userId);
    res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete company';
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 400;
    res.status(status).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware archiveCompanyMiddleware
/**
 * Middleware para archivar una compañía
 * POST /api/company/:id/archive
 * Params: { id: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const archiveCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || req.body.userId; // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const company = await archiveCompanyService(companyId, userId);
    res.status(200).json({ success: true, company, message: 'Company archived successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to archive company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('already archived') ? 409 : 400;
    res.status(status).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware reactivateCompanyMiddleware
/**
 * Middleware para reactivar una compañía archivada
 * POST /api/company/:id/reactivate
 * Params: { id: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const reactivateCompanyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || req.body.userId; // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const company = await reactivateCompanyService(companyId, userId);
    res.status(200).json({ success: true, company, message: 'Company reactivated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reactivate company';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 
                   message.includes('not archived') ? 409 : 400;
    res.status(status).json({ success: false, error: message });
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
      res.status(400).json({ success: false, error: 'Company name is required' });
      return;
    }

    const isAvailable = await checkNameAvailability(name);
    res.status(200).json({ success: true, available: isAvailable });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check name availability';
    res.status(400).json({ success: false, error: message });
  }
};
// #end-middleware

// #middleware checkCompanyPermissionMiddleware
/**
 * Middleware para verificar permisos de usuario sobre una compañía
 * GET /api/company/:id/permission
 * Params: { id: number }
 * Headers: Requiere autenticación (userId extraído del JWT)
 */
export const checkCompanyPermissionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Extraer userId del JWT cuando se implemente el middleware de autenticación
    const userId = (req as any).user?.id || parseInt(req.query.userId as string); // Temporal
    const companyId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: User ID is required' });
      return;
    }

    const result = await checkCompanyPermissionService(companyId, userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check permission';
    res.status(400).json({ success: false, error: message });
  }
};
// #end-middleware
