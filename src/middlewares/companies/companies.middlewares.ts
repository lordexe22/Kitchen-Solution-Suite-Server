/* src/middlewares/companies/companies.middlewares.ts */
// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { companiesTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { branchesTable, branchSchedulesTable } from '../../db/schema';
import { not } from 'drizzle-orm';
import { branchSocialsTable } from "../../db/schema";
import { uploadFile, deleteFile, loadConfig, CLOUDINARY_FOLDERS } from '../../modules/cloudinary';
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
 * Elimina lógicamente una compañía (soft delete).
 * Renombra la compañía agregando timestamp para liberar el nombre.
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

    // Obtener la compañía actual
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .limit(1);

    if (!company) {
      res.status(404).json({
        success: false,
        error: 'Compañía no encontrada'
      });
      return;
    }

    // Generar nuevo nombre con timestamp para liberar el nombre original
    const timestamp = Date.now();
    const newName = `${company.name}_deleted_${timestamp}`;

    // Soft delete con renombre
    await db
      .update(companiesTable)
      .set({
        name: newName,  // ✅ Renombrar para liberar el nombre
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(companiesTable.id, companyId));

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
// #middleware applySchedulesToAllBranches
/**
 * Middleware: applySchedulesToAllBranches
 * 
 * Aplica los horarios de una sucursal origen a todas las demás sucursales de la compañía.
 * Copia los horarios de la sucursal fuente y los aplica a las demás.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const applySchedulesToAllBranches = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.companyId);
    const sourceBranchId = Number(req.params.sourceBranchId);
    const ownerId = req.user!.userId;

    // 1. Verificar que la compañía pertenece al usuario
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

    // 2. Obtener los horarios de la sucursal origen
    const sourceSchedules = await db
      .select()
      .from(branchSchedulesTable)
      .where(eq(branchSchedulesTable.branchId, sourceBranchId));

    if (sourceSchedules.length === 0) {
      res.status(400).json({
        success: false,
        error: 'La sucursal origen no tiene horarios configurados'
      });
      return;
    }

    // 3. Obtener todas las sucursales activas de la compañía (excepto la origen)
    const targetBranches = await db
      .select()
      .from(branchesTable)
      .where(
        and(
          eq(branchesTable.companyId, companyId),
          eq(branchesTable.isActive, true),
          not(eq(branchesTable.id, sourceBranchId))
        )
      );

    // 4. Para cada sucursal objetivo, eliminar horarios existentes y crear nuevos
    for (const targetBranch of targetBranches) {
      // Eliminar horarios existentes
      await db
        .delete(branchSchedulesTable)
        .where(eq(branchSchedulesTable.branchId, targetBranch.id));

      // Crear nuevos horarios (copia de los de origen)
      await db
        .insert(branchSchedulesTable)
        .values(
          sourceSchedules.map(s => ({
            branchId: targetBranch.id,
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime,
            closeTime: s.closeTime,
            isClosed: s.isClosed
          }))
        );
    }

    res.status(200).json({
      success: true,
      message: `Horarios aplicados a ${targetBranches.length} sucursales`
    });
  } catch (error) {
    console.error('Error aplicando horarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aplicar horarios a las sucursales'
    });
  }
};
// #end-middleware
// #middleware applySocialsToAllBranches
/**
 * Middleware: applySocialsToAllBranches
 * 
 * Aplica las redes sociales de una sucursal fuente a todas las demás sucursales de la compañía.
 * Copia las redes sociales de la sucursal fuente y las aplica a las demás.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const applySocialsToAllBranches = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.companyId);
    const sourceBranchId = Number(req.params.sourceBranchId);
    const ownerId = req.user!.userId;

    // 1. Verificar que la compañía pertenece al usuario
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

    // 2. Obtener las redes sociales de la sucursal origen
    const sourceSocials = await db
      .select()
      .from(branchSocialsTable)
      .where(eq(branchSocialsTable.branchId, sourceBranchId));

    if (sourceSocials.length === 0) {
      res.status(400).json({
        success: false,
        error: 'La sucursal origen no tiene redes sociales configuradas'
      });
      return;
    }

    // 3. Obtener todas las sucursales activas de la compañía (excepto la origen)
    const targetBranches = await db
      .select()
      .from(branchesTable)
      .where(
        and(
          eq(branchesTable.companyId, companyId),
          eq(branchesTable.isActive, true),
          not(eq(branchesTable.id, sourceBranchId))
        )
      );

    // 4. Para cada sucursal objetivo, eliminar redes sociales existentes y crear nuevas
    for (const targetBranch of targetBranches) {
      // Eliminar redes sociales existentes
      await db
        .delete(branchSocialsTable)
        .where(eq(branchSocialsTable.branchId, targetBranch.id));

      // Crear nuevas redes sociales (copia de las de origen)
      await db
        .insert(branchSocialsTable)
        .values(
          sourceSocials.map(s => ({
            branchId: targetBranch.id,
            platform: s.platform,
            url: s.url
          }))
        );
    }

    res.status(200).json({
      success: true,
      message: `Redes sociales aplicadas a ${targetBranches.length} sucursales`
    });
  } catch (error) {
    console.error('Error aplicando redes sociales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aplicar redes sociales a las sucursales'
    });
  }
};
// #end-middleware
// #middleware Logo Management
/**
 * Middleware: uploadCompanyLogo
 * 
 * Sube o actualiza el logo de una compañía en Cloudinary.
 * Actualiza el campo logoUrl en la base de datos.
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * - uploadSingleFile('logo') (para obtener req.file)
 * - validateFileExists (para verificar que existe archivo)
 * - validateCompanyId y verifyCompanyOwnership (para verificar permisos)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado y file
 * @param {Response} res - Response de Express
 */
export const uploadCompanyLogo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir folder y publicId usando helper
    const { folder, publicId } = CLOUDINARY_FOLDERS.companies.logos(
      companyId,
      rootFolder
    );

    // Subir archivo a Cloudinary
    const uploadResult = await uploadFile(req.file!.buffer, {
      folder,
      publicId,
      overwrite: true, // Sobrescribir si ya existe
      resourceType: 'image',
      tags: ['company-logo', `company-${companyId}`],
    });

    // Actualizar logoUrl en la base de datos
    const [updatedCompany] = await db
      .update(companiesTable)
      .set({
        logoUrl: uploadResult.secureUrl,
        updatedAt: new Date(),
      })
      .where(eq(companiesTable.id, companyId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        company: updatedCompany,
        cloudinary: {
          publicId: uploadResult.publicId,
          url: uploadResult.secureUrl,
        },
      },
    });
  } catch (error: any) {
    console.error('Error uploading company logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo',
      details: error.message,
    });
  }
};
// #end-middleware
// #middleware deleteCompanyLogo
/**
 * Middleware: deleteCompanyLogo
 * 
 * Elimina el logo de una compañía de Cloudinary y actualiza la BD.
 * 
 * Requiere:
 * - validateJWTAndGetPayload (para obtener userId)
 * - validateCompanyId y verifyCompanyOwnership (para verificar permisos)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteCompanyLogo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.id);

    // Verificar que la compañía tiene logo
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .limit(1);

    if (!company || !company.logoUrl) {
      res.status(400).json({
        success: false,
        error: 'Company does not have a logo',
      });
      return;
    }

    // Obtener rootFolder desde config
    const config = loadConfig();
    const rootFolder = config.rootFolder;

    // Construir publicId completo
    const { folder, publicId } = CLOUDINARY_FOLDERS.companies.logos(
      companyId,
      rootFolder
    );
    const fullPublicId = `${folder}/${publicId}`;

    // Eliminar de Cloudinary
    await deleteFile(fullPublicId, {
      resourceType: 'image',
    });

    // Actualizar logoUrl en la base de datos (setear a null)
    const [updatedCompany] = await db
      .update(companiesTable)
      .set({
        logoUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(companiesTable.id, companyId))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Logo deleted successfully',
      data: {
        company: updatedCompany,
      },
    });
  } catch (error: any) {
    console.error('Error deleting company logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete logo',
      details: error.message,
    });
  }
};
// #end-middleware