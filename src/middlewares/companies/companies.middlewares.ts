/* src/middlewares/companies/companies.middlewares.ts */
// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { companiesTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
// #end-section

// #middleware validateCreateCompanyPayload
/**
 * Middleware: validateCreateCompanyPayload
 * 
 * Valida los datos para crear una compañía.
 * - name: obligatorio, string, 1-255 caracteres
 * - description: opcional, string, máx 500 caracteres
 * - logoUrl: opcional, string
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCreateCompanyPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { name, description, logoUrl } = req.body;

  // Validar name (obligatorio)
  if (!name || typeof name !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El nombre de la compañía es obligatorio'
    });
    return;
  }

  if (name.trim().length === 0 || name.trim().length > 255) {
    res.status(400).json({
      success: false,
      error: 'El nombre debe tener entre 1 y 255 caracteres'
    });
    return;
  }

  // Validar description (opcional)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      res.status(400).json({
        success: false,
        error: 'La descripción debe ser un texto'
      });
      return;
    }

    if (description.length > 500) {
      res.status(400).json({
        success: false,
        error: 'La descripción no puede superar los 500 caracteres'
      });
      return;
    }
  }

  // Validar logoUrl (opcional)
  if (logoUrl !== undefined && logoUrl !== null && typeof logoUrl !== 'string') {
    res.status(400).json({
      success: false,
      error: 'La URL del logo debe ser un texto'
    });
    return;
  }

  // Normalizar datos
  req.body = {
    name: name.trim(),
    description: description?.trim() || null,
    logoUrl: logoUrl?.trim() || null
  };

  next();
};
// #end-middleware

// #middleware validateUpdateCompanyPayload
/**
 * Middleware: validateUpdateCompanyPayload
 * 
 * Valida los datos para actualizar una compañía.
 * Todos los campos son opcionales, pero al menos uno debe estar presente.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateUpdateCompanyPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { name, description, logoUrl } = req.body;

  // Al menos un campo debe estar presente
  if (name === undefined && description === undefined && logoUrl === undefined) {
    res.status(400).json({
      success: false,
      error: 'Debe proporcionar al menos un campo para actualizar'
    });
    return;
  }

  // Validar name (si está presente)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 255) {
      res.status(400).json({
        success: false,
        error: 'El nombre debe tener entre 1 y 255 caracteres'
      });
      return;
    }
  }

  // Validar description (si está presente)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string' || description.length > 500) {
      res.status(400).json({
        success: false,
        error: 'La descripción debe ser un texto de máximo 500 caracteres'
      });
      return;
    }
  }

  // Validar logoUrl (si está presente)
  if (logoUrl !== undefined && logoUrl !== null && typeof logoUrl !== 'string') {
    res.status(400).json({
      success: false,
      error: 'La URL del logo debe ser un texto'
    });
    return;
  }

  // Normalizar datos
  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl?.trim() || null;

  req.body = updates;
  next();
};
// #end-middleware

// #middleware validateCompanyId
/**
 * Middleware: validateCompanyId
 * 
 * Valida que el ID de la compañía en los params sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCompanyId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const companyId = Number(req.params.id);

  if (isNaN(companyId) || companyId <= 0) {
    res.status(400).json({
      success: false,
      error: 'ID de compañía inválido'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware verifyCompanyOwnership
/**
 * Middleware: verifyCompanyOwnership
 * 
 * Verifica que la compañía pertenezca al usuario autenticado.
 * Usa Drizzle ORM para la consulta.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const verifyCompanyOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);
    const ownerId = req.user!.userId;

    const [company] = await db
      .select()
      .from(companiesTable)
      .where(
        and(
          eq(companiesTable.id, companyId),
          eq(companiesTable.ownerId, ownerId),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (!company) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta compañía'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware

// #middleware createCompany
/**
 * Middleware: createCompany
 * 
 * Crea una nueva compañía en la base de datos usando Drizzle ORM.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { name, description, logoUrl } = req.body;

    // Verificar que el nombre no exista
    const [existing] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.name, name))
      .limit(1);

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Ya existe una compañía con ese nombre'
      });
      return;
    }

    // Crear la compañía
    const [newCompany] = await db
      .insert(companiesTable)
      .values({
        name,
        description,
        logoUrl,
        ownerId
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        company: newCompany
      }
    });
  } catch (error) {
    console.error('Error creando compañía:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la compañía'
    });
  }
};
// #end-middleware

// #middleware getUserCompanies
/**
 * Middleware: getUserCompanies
 * 
 * Obtiene todas las compañías activas del usuario autenticado.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getUserCompanies = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const ownerId = req.user!.userId;

    const companies = await db
      .select()
      .from(companiesTable)
      .where(
        and(
          eq(companiesTable.ownerId, ownerId),
          eq(companiesTable.isActive, true)
        )
      )
      .orderBy(companiesTable.createdAt);

    res.status(200).json({
      success: true,
      data: {
        companies
      }
    });
  } catch (error) {
    console.error('Error obteniendo compañías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las compañías'
    });
  }
};
// #end-middleware

// #middleware getCompanyById
/**
 * Middleware: getCompanyById
 * 
 * Obtiene una compañía específica por ID.
 * Requiere que verifyCompanyOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getCompanyById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);
    const ownerId = req.user!.userId;

    const [company] = await db
      .select()
      .from(companiesTable)
      .where(
        and(
          eq(companiesTable.id, companyId),
          eq(companiesTable.ownerId, ownerId),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (!company) {
      res.status(404).json({
        success: false,
        error: 'Compañía no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Error obteniendo compañía:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la compañía'
    });
  }
};
// #end-middleware

// #middleware updateCompany
/**
 * Middleware: updateCompany
 * 
 * Actualiza los datos de una compañía.
 * Requiere que verifyCompanyOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);
    const ownerId = req.user!.userId;
    const updates = req.body;

    // Si se está actualizando el nombre, verificar que no exista
    if (updates.name) {
      const [existing] = await db
        .select()
        .from(companiesTable)
        .where(
          and(
            eq(companiesTable.name, updates.name),
            eq(companiesTable.isActive, true)
          )
        )
        .limit(1);

      if (existing && existing.id !== companyId) {
        res.status(409).json({
          success: false,
          error: 'Ya existe una compañía con ese nombre'
        });
        return;
      }
    }

    // Actualizar la compañía
    const [updatedCompany] = await db
      .update(companiesTable)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(companiesTable.id, companyId),
          eq(companiesTable.ownerId, ownerId),
          eq(companiesTable.isActive, true)
        )
      )
      .returning();

    if (!updatedCompany) {
      res.status(404).json({
        success: false,
        error: 'Compañía no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        company: updatedCompany
      }
    });
  } catch (error) {
    console.error('Error actualizando compañía:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la compañía'
    });
  }
};
// #end-middleware

// #middleware softDeleteCompany
/**
 * Middleware: softDeleteCompany
 * 
 * Realiza un soft delete de la compañía.
 * Marca isActive = false y establece deletedAt.
 * Requiere que verifyCompanyOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const softDeleteCompany = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);
    const ownerId = req.user!.userId;

    const [deletedCompany] = await db
      .update(companiesTable)
      .set({
        isActive: false,
        deletedAt: new Date()
      })
      .where(
        and(
          eq(companiesTable.id, companyId),
          eq(companiesTable.ownerId, ownerId),
          eq(companiesTable.isActive, true)
        )
      )
      .returning();

    if (!deletedCompany) {
      res.status(404).json({
        success: false,
        error: 'Compañía no encontrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Compañía eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando compañía:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la compañía'
    });
  }
};
// #end-middleware

// #middleware checkCompanyNameAvailability
/**
 * Middleware: checkCompanyNameAvailability
 * 
 * Verifica si un nombre de compañía está disponible.
 * 
 * Body: { name: string }
 * Response: { available: boolean }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const checkCompanyNameAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Debe proporcionar un nombre para verificar'
      });
      return;
    }

    const [existing] = await db
      .select()
      .from(companiesTable)
      .where(
        and(
          eq(companiesTable.name, name.trim()),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    res.status(200).json({
      success: true,
      data: {
        available: !existing
      }
    });
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar disponibilidad del nombre'
    });
  }
};
// #end-middleware