/* src/middlewares/branches/branches.middlewares.ts */
// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { branchesTable, branchLocationsTable, companiesTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
// #end-section
// #middleware validateCreateBranchPayload
/**
 * Middleware: validateCreateBranchPayload
 * 
 * Valida los datos para crear una sucursal.
 * - companyId: obligatorio, número válido
 * - name: opcional, string, máx 255 caracteres
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCreateBranchPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { companyId, name } = req.body;

  // Validar companyId (obligatorio)
  if (!companyId || typeof companyId !== 'number') {
    res.status(400).json({
      success: false,
      error: 'El ID de la compañía es obligatorio y debe ser un número'
    });
    return;
  }

  // Validar name (opcional)
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: 'El nombre debe ser un texto'
      });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({
        success: false,
        error: 'El nombre no puede superar los 255 caracteres'
      });
      return;
    }
  }

  // Normalizar datos
  req.body = {
    companyId,
    name: name?.trim() || null
  };

  next();
};
// #end-middleware
// #middleware validateUpdateBranchPayload
/**
 * Middleware: validateUpdateBranchPayload
 * 
 * Valida los datos para actualizar una sucursal.
 * Solo permite actualizar el campo name.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateUpdateBranchPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { name } = req.body;

  // Al menos el campo name debe estar presente
  if (name === undefined) {
    res.status(400).json({
      success: false,
      error: 'Debe proporcionar el campo name para actualizar'
    });
    return;
  }

  // Validar name
  if (name !== null) {
    if (typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: 'El nombre debe ser un texto'
      });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({
        success: false,
        error: 'El nombre no puede superar los 255 caracteres'
      });
      return;
    }
  }

  // Normalizar datos
  req.body = {
    name: name?.trim() || null
  };

  next();
};
// #end-middleware
// #middleware validateBranchId
/**
 * Middleware: validateBranchId
 * 
 * Valida que el ID de la sucursal en los params sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateBranchId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const branchId = Number(req.params.id);

  console.log(`\n📋 [validateBranchId] branchId=${branchId}`);

  if (isNaN(branchId) || branchId <= 0) {
    console.log(`  ❌ Invalid branchId`);
    res.status(400).json({
      success: false,
      error: 'ID de sucursal inválido'
    });
    return;
  }

  console.log(`  ✅ BranchId valid`);
  next();
};
// #end-middleware
// #middleware verifyBranchOwnership
/**
 * Middleware: verifyBranchOwnership
 * 
 * Verifica que la sucursal pertenezca a una compañía del usuario autenticado.
 * Usa Drizzle ORM para la consulta con JOIN.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const verifyBranchOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const ownerId = req.user!.userId;

    // Verificar que la sucursal existe y pertenece a una compañía del usuario
    const [branch] = await db
      .select()
      .from(branchesTable)
      .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(companiesTable.ownerId, ownerId),
          eq(branchesTable.isActive, true),
          eq(companiesTable.isActive, true)
        )
      )
      .limit(1);

    if (!branch) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta sucursal'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de sucursal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware

// #middleware verifyEmployeeBranchAccess
/**
 * Middleware: verifyEmployeeBranchAccess
 * 
 * Verifica acceso a una sucursal para ADMIN y EMPLOYEE:
 * - Admin: debe ser propietario de la compañía
 * - Employee: debe estar asignado a esa sucursal (branchId match)
 * 
 * Este middleware REEMPLAZA a verifyBranchOwnership para rutas
 * que necesitan soportar acceso de empleados.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const verifyEmployeeBranchAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { userId, type: userType, branchId: userBranchId } = req.user!;

    console.log('🔐 [verifyEmployeeBranchAccess] START');
    console.log('  - branchId (params):', branchId);
    console.log('  - userId:', userId);
    console.log('  - userType:', userType);
    console.log('  - userBranchId:', userBranchId);

    // #step 1 - validar que la sucursal existe y está activa
    const [branch] = await db
      .select()
      .from(branchesTable)
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(branchesTable.isActive, true)
        )
      )
      .limit(1);

    console.log('  - branch found:', !!branch);

    if (!branch) {
      console.log('  ❌ Branch not found or inactive');
      res.status(404).json({
        success: false,
        error: 'La sucursal no existe o está inactiva'
      });
      return;
    }
    // #end-step

    // #step 2 - validar acceso según tipo de usuario
    if (userType === 'admin') {
      console.log('  - Checking ADMIN access...');
      // Admin: debe ser propietario de la compañía
      const [company] = await db
        .select()
        .from(companiesTable)
        .where(
          and(
            eq(companiesTable.id, branch.companyId),
            eq(companiesTable.ownerId, userId),
            eq(companiesTable.isActive, true)
          )
        )
        .limit(1);

      console.log('  - admin company found:', !!company);

      if (!company) {
        console.log('  ❌ Admin: No company ownership');
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para acceder a esta sucursal'
        });
        return;
      }
      console.log('  ✅ Admin access GRANTED');
    } else if (userType === 'employee') {
      console.log('  - Checking EMPLOYEE access...');
      // Employee: debe estar asignado a esa sucursal

      if (userBranchId !== branchId) {
        console.log(`  ❌ Employee: branchId mismatch (user: ${userBranchId}, request: ${branchId})`);
        res.status(403).json({
          success: false,
          error: 'No estás asignado a esta sucursal'
        });
        return;
      }
      console.log('  ✅ Employee access GRANTED');
    } else {
      console.log('  ❌ Invalid user type:', userType);
      // Otros tipos de usuario (guest, dev) no tienen acceso
      res.status(403).json({
        success: false,
        error: 'Tu tipo de usuario no tiene acceso a sucursales'
      });
      return;
    }
    // #end-step

    console.log('  ✅ [verifyEmployeeBranchAccess] PASSED');
    next();
  } catch (error) {
    console.error('❌ [verifyEmployeeBranchAccess] ERROR:', error);

    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware

// #middleware verifyCompanyOwnership
/**
 * Middleware: verifyCompanyOwnership
 * 
 * Verifica que la compañía pertenezca al usuario autenticado.
 * Se usa antes de crear una sucursal.
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
    const companyId = req.body.companyId;
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
    console.error('Error verificando ownership de compañía:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar permisos'
    });
  }
};
// #end-middleware
// #middleware createBranch
/**
 * Middleware: createBranch
 * 
 * Crea una nueva sucursal en la base de datos usando Drizzle ORM.
 * El nombre es opcional (nullable).
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createBranch = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { companyId, name } = req.body;

    // Crear la sucursal
    const [newBranch] = await db
      .insert(branchesTable)
      .values({
        companyId,
        name: name || null
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        branch: newBranch
      }
    });
  } catch (error) {
    console.error('Error creando sucursal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la sucursal'
    });
  }
};
// #end-middleware
// #middleware getCompanyBranches
/**
 * Middleware: getCompanyBranches
 * 
 * Obtiene todas las sucursales activas de una compañía.
 * Incluye las ubicaciones (LEFT JOIN).
 * Ordenadas por createdAt ASC (más antigua primero).
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getCompanyBranches = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const companyId = Number(req.params.companyId);

    // Obtener sucursales con sus ubicaciones
    const branches = await db
      .select()
      .from(branchesTable)
      .leftJoin(branchLocationsTable, eq(branchesTable.id, branchLocationsTable.branchId))
      .where(
        and(
          eq(branchesTable.companyId, companyId),
          eq(branchesTable.isActive, true)
        )
      )
      .orderBy(branchesTable.createdAt);

    // Formatear respuesta
    const formattedBranches = branches.map(row => ({
      ...row.branches,
      location: row.branch_locations || null
    }));

    res.status(200).json({
      success: true,
      data: {
        branches: formattedBranches
      }
    });
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las sucursales'
    });
  }
};
// #end-middleware
// #middleware getBranchById
/**
 * Middleware: getBranchById
 * 
 * Obtiene una sucursal específica por ID.
 * Incluye su ubicación si existe.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getBranchById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    const [result] = await db
      .select()
      .from(branchesTable)
      .leftJoin(branchLocationsTable, eq(branchesTable.id, branchLocationsTable.branchId))
      .where(
        and(
          eq(branchesTable.id, branchId),
          eq(branchesTable.isActive, true)
        )
      )
      .limit(1);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Sucursal no encontrada'
      });
      return;
    }

    const branch = {
      ...result.branches,
      location: result.branch_locations || null
    };

    res.status(200).json({
      success: true,
      data: {
        branch
      }
    });
  } catch (error) {
    console.error('Error obteniendo sucursal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la sucursal'
    });
  }
};
// #end-middleware
// #middleware updateBranch
/**
 * Middleware: updateBranch
 * 
 * Actualiza los datos de una sucursal (solo el nombre).
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateBranch = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { name } = req.body;

    const [updatedBranch] = await db
      .update(branchesTable)
      .set({
        name,
        updatedAt: new Date()
      })
      .where(eq(branchesTable.id, branchId))
      .returning();

    res.status(200).json({
      success: true,
      data: {
        branch: updatedBranch
      }
    });
  } catch (error) {
    console.error('Error actualizando sucursal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la sucursal'
    });
  }
};
// #end-middleware
// #middleware softDeleteBranch
/**
 * Middleware: softDeleteBranch
 * 
 * Elimina lógicamente una sucursal (soft delete).
 * Si tiene nombre, lo renombra agregando timestamp para liberar el nombre.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const softDeleteBranch = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    // Obtener la sucursal actual
    const [branch] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, branchId))
      .limit(1);

    if (!branch) {
      res.status(404).json({
        success: false,
        error: 'Sucursal no encontrada'
      });
      return;
    }

    // Si tiene nombre, renombrarlo para liberar el nombre original
    let newName = branch.name;
    if (branch.name) {
      const timestamp = Date.now();
      newName = `${branch.name}_deleted_${timestamp}`;
    }

    // Soft delete con renombre (si aplica)
    await db
      .update(branchesTable)
      .set({
        name: newName,  // ✅ Renombrar si tiene nombre
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(branchesTable.id, branchId));

    res.status(200).json({
      success: true,
      message: 'Sucursal eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando sucursal:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la sucursal'
    });
  }
};
// #end-middleware
// #middleware validateCreateLocationPayload
/**
 * Middleware: validateCreateLocationPayload
 * 
 * Valida los datos para crear/actualizar una ubicación.
 * - address: obligatorio, string, máx 500 caracteres
 * - city: obligatorio, string, máx 100 caracteres
 * - state: obligatorio, string, máx 100 caracteres
 * - country: obligatorio, string, máx 100 caracteres
 * - postalCode: opcional, string, máx 20 caracteres
 * - latitude: opcional, string (decimal)
 * - longitude: opcional, string (decimal)
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCreateLocationPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { address, city, state, country, postalCode, latitude, longitude } = req.body;

  // Validar address (obligatorio)
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'La dirección es obligatoria'
    });
    return;
  }

  if (address.trim().length > 500) {
    res.status(400).json({
      success: false,
      error: 'La dirección no puede superar los 500 caracteres'
    });
    return;
  }

  // Validar city (obligatorio)
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'La ciudad es obligatoria'
    });
    return;
  }

  if (city.trim().length > 100) {
    res.status(400).json({
      success: false,
      error: 'La ciudad no puede superar los 100 caracteres'
    });
    return;
  }

  // Validar state (obligatorio)
  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'El estado/provincia es obligatorio'
    });
    return;
  }

  if (state.trim().length > 100) {
    res.status(400).json({
      success: false,
      error: 'El estado/provincia no puede superar los 100 caracteres'
    });
    return;
  }

  // Validar country (obligatorio)
  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'El país es obligatorio'
    });
    return;
  }

  if (country.trim().length > 100) {
    res.status(400).json({
      success: false,
      error: 'El país no puede superar los 100 caracteres'
    });
    return;
  }

  // Validar postalCode (opcional)
  if (postalCode !== undefined && postalCode !== null && postalCode !== '') {
    if (typeof postalCode !== 'string' || postalCode.trim().length > 20) {
      res.status(400).json({
        success: false,
        error: 'El código postal debe ser un texto de máximo 20 caracteres'
      });
      return;
    }
  }

  // ✅ FIX: Validar latitude (opcional) - SOLO si tiene contenido
  if (latitude !== undefined && latitude !== null && latitude !== '') {
    if (typeof latitude !== 'string' || isNaN(parseFloat(latitude))) {
      res.status(400).json({
        success: false,
        error: 'La latitud debe ser un número válido'
      });
      return;
    }
  }

  // ✅ FIX: Validar longitude (opcional) - SOLO si tiene contenido
  if (longitude !== undefined && longitude !== null && longitude !== '') {
    if (typeof longitude !== 'string' || isNaN(parseFloat(longitude))) {
      res.status(400).json({
        success: false,
        error: 'La longitud debe ser un número válido'
      });
      return;
    }
  }

  // Normalizar datos
  req.body = {
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    postalCode: postalCode?.trim() || null,
    latitude: (latitude && latitude.trim()) || null, // ✅ FIX: Convertir string vacío a null
    longitude: (longitude && longitude.trim()) || null // ✅ FIX: Convertir string vacío a null
  };

  next();
};
// #end-middleware
// #middleware createBranchLocation
/**
 * Middleware: createBranchLocation
 * 
 * Crea o actualiza la ubicación de una sucursal.
 * Si ya existe una ubicación, la actualiza (UPSERT).
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createBranchLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { address, city, state, country, postalCode, latitude, longitude } = req.body;

    // Verificar si ya existe una ubicación para esta sucursal
    const [existingLocation] = await db
      .select()
      .from(branchLocationsTable)
      .where(eq(branchLocationsTable.branchId, branchId))
      .limit(1);

    let location;

    if (existingLocation) {
      // Actualizar ubicación existente
      [location] = await db
        .update(branchLocationsTable)
        .set({
          address,
          city,
          state,
          country,
          postalCode,
          latitude,
          longitude,
          updatedAt: new Date()
        })
        .where(eq(branchLocationsTable.branchId, branchId))
        .returning();
    } else {
      // Crear nueva ubicación
      [location] = await db
        .insert(branchLocationsTable)
        .values({
          branchId,
          address,
          city,
          state,
          country,
          postalCode,
          latitude,
          longitude
        })
        .returning();
    }

    res.status(existingLocation ? 200 : 201).json({
      success: true,
      data: {
        location
      }
    });
  } catch (error) {
    console.error('Error creando/actualizando ubicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear/actualizar la ubicación'
    });
  }
};
// #end-middleware
// #middleware getBranchLocation
/**
 * Middleware: getBranchLocation
 * 
 * Obtiene la ubicación de una sucursal específica.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getBranchLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    const [location] = await db
      .select()
      .from(branchLocationsTable)
      .where(eq(branchLocationsTable.branchId, branchId))
      .limit(1);

    if (!location) {
      res.status(404).json({
        success: false,
        error: 'Esta sucursal no tiene ubicación registrada'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        location
      }
    });
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la ubicación'
    });
  }
};
// #end-middleware
// #middleware deleteBranchLocation
/**
 * Middleware: deleteBranchLocation
 * 
 * Elimina la ubicación de una sucursal (hard delete).
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteBranchLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    await db
      .delete(branchLocationsTable)
      .where(eq(branchLocationsTable.branchId, branchId));

    res.status(200).json({
      success: true,
      message: 'Ubicación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando ubicación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la ubicación'
    });
  }
};
// #end-middleware
// #middleware requireBranchAccess
/**
 * Middleware: requireBranchAccess
 * 
 * Middleware compuesto que verifica acceso a sucursal según tipo de usuario:
 * - admin: delega a verifyBranchOwnership (ownership via company)
 * - employee: delega a verifyEmployeeBranchAccess (branchId match)
 * - otros: bloquea con 403
 * 
 * Este middleware orquesta la decisión de qué lógica aplicar según el tipo
 * de usuario, manteniendo separadas las responsabilidades.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 * 
 * @example
 * // Permitir a admin (owner) y employee (asignado) editar productos
 * router.put('/products/:id',
 *   validateJWTAndGetPayload,
 *   requireRole('admin', 'employee'),
 *   requireBranchAccess, // Admin: ownership, Employee: branchId match
 *   requirePermission('products', 'canEdit'),
 *   updateProduct
 * );
 */
export const requireBranchAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userType = req.user?.type;

  if (userType === 'admin') {
    // Delegar a la lógica existente de ownership
    return verifyBranchOwnership(req, res, next);
  }

  if (userType === 'employee') {
    // Delegar a la lógica específica de employee
    return verifyEmployeeBranchAccess(req, res, next);
  }

  // Guest, dev u otros no tienen acceso
  res.status(403).json({
    success: false,
    error: 'No tienes permisos para acceder a esta sucursal'
  });
};
// #end-middleware