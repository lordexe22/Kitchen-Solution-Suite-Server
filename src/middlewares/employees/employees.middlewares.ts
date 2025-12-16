/* src/middlewares/employees/employees.middlewares.ts */

// #section Imports
import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../modules/jwtManager/jwtManager.types';
import { db } from '../../db/init';
import { usersTable, branchesTable, companiesTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { EmployeePermissions } from '../../config/permissions.config';
import { DEFAULT_EMPLOYEE_PERMISSIONS } from '../../config/permissions.config';
// #end-section

// #middleware validateCreateEmployeePayload
/**
 * Valida los datos para crear un empleado.
 * 
 * Campos requeridos:
 * - email: string, formato email válido
 * - password: string, mínimo 6 caracteres
 * - firstName: string, 1-255 caracteres
 * - lastName: string, 1-255 caracteres
 * - branchId: number, sucursal existente
 * - permissions: objeto EmployeePermissions (opcional, usa defaults)
 * 
 * NO valida ownership aquí, eso lo hace verifyBranchOwnership.
 */
export const validateCreateEmployeePayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { email, password, firstName, lastName, branchId, permissions } = req.body;

  // #step 1 - Validar email
  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El email es obligatorio'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Formato de email inválido'
    });
    return;
  }
  // #end-step

  // #step 2 - Validar password
  if (!password || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      error: 'La contraseña es obligatoria'
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 6 caracteres'
    });
    return;
  }
  // #end-step

  // #step 3 - Validar firstName
  if (!firstName || typeof firstName !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El nombre es obligatorio'
    });
    return;
  }

  if (firstName.trim().length === 0 || firstName.trim().length > 255) {
    res.status(400).json({
      success: false,
      error: 'El nombre debe tener entre 1 y 255 caracteres'
    });
    return;
  }
  // #end-step

  // #step 4 - Validar lastName
  if (!lastName || typeof lastName !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El apellido es obligatorio'
    });
    return;
  }

  if (lastName.trim().length === 0 || lastName.trim().length > 255) {
    res.status(400).json({
      success: false,
      error: 'El apellido debe tener entre 1 y 255 caracteres'
    });
    return;
  }
  // #end-step

  // #step 5 - Validar branchId
  if (!branchId || typeof branchId !== 'number') {
    res.status(400).json({
      success: false,
      error: 'El ID de sucursal es obligatorio'
    });
    return;
  }
  // #end-step

  // #step 6 - Validar permissions (opcional, usa defaults)
  let validatedPermissions: EmployeePermissions = DEFAULT_EMPLOYEE_PERMISSIONS;

  if (permissions) {
    if (typeof permissions !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Los permisos deben ser un objeto válido'
      });
      return;
    }

    // Validar estructura básica de permisos
    const modules = ['products', 'categories', 'schedules', 'socials'];
    for (const module of modules) {
      if (permissions[module]) {
        const modulePerms = permissions[module];
        if (typeof modulePerms !== 'object') {
          res.status(400).json({
            success: false,
            error: `Los permisos de ${module} deben ser un objeto`
          });
          return;
        }
      }
    }

    validatedPermissions = permissions;
  }
  // #end-step

  // #step 7 - Normalizar datos
  req.body = {
    email: email.trim().toLowerCase(),
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    branchId,
    permissions: validatedPermissions
  };
  // #end-step

  next();
};
// #end-middleware

// #middleware validateUpdatePermissionsPayload
/**
 * Valida los datos para actualizar permisos de un empleado.
 * 
 * Campos requeridos:
 * - permissions: objeto EmployeePermissions completo
 */
export const validateUpdatePermissionsPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { permissions } = req.body;

  // #step 1 - Validar que permissions existe
  if (!permissions || typeof permissions !== 'object') {
    res.status(400).json({
      success: false,
      error: 'Los permisos son obligatorios y deben ser un objeto válido'
    });
    return;
  }
  // #end-step

  // #step 2 - Validar estructura de permisos
  const modules = ['products', 'categories', 'schedules', 'socials'];
  for (const module of modules) {
    if (!permissions[module]) {
      res.status(400).json({
        success: false,
        error: `Faltan permisos para el módulo: ${module}`
      });
      return;
    }

    const modulePerms = permissions[module];
    if (typeof modulePerms !== 'object') {
      res.status(400).json({
        success: false,
        error: `Los permisos de ${module} deben ser un objeto`
      });
      return;
    }
  }
  // #end-step

  next();
};
// #end-middleware

// #middleware verifyEmployeeOwnership
/**
 * Verifica que el admin sea dueño de la compañía a la que pertenece el empleado.
 * 
 * Debe ejecutarse DESPUÉS de validateJWTAndGetPayload.
 * Lee el employeeId de req.params.id y verifica ownership via branches -> companies.
 * 
 * Si el empleado no existe, retorna 404.
 * Si el admin no es dueño, retorna 403.
 */
export const verifyEmployeeOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const employeeId = parseInt(req.params.id);
  const adminId = req.user?.userId;

  if (!adminId) {
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado'
    });
    return;
  }

  if (isNaN(employeeId)) {
    res.status(400).json({
      success: false,
      error: 'ID de empleado inválido'
    });
    return;
  }

  // #step 1 - Buscar empleado con joins a branch y company
  const [employeeData] = await db
    .select({
      employee: usersTable,
      branch: branchesTable,
      company: companiesTable
    })
    .from(usersTable)
    .innerJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
    .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
    .where(
      and(
        eq(usersTable.id, employeeId),
        eq(usersTable.type, 'employee')
      )
    );

  if (!employeeData) {
    res.status(404).json({
      success: false,
      error: 'Empleado no encontrado'
    });
    return;
  }
  // #end-step

  // #step 2 - Verificar ownership
  if (employeeData.company.ownerId !== adminId) {
    console.warn(
      `[verifyEmployeeOwnership] Acceso denegado - Admin ID: ${adminId} intentó acceder a empleado ID: ${employeeId} de compañía ID: ${employeeData.company.id} (Owner: ${employeeData.company.ownerId})`
    );
    res.status(403).json({
      success: false,
      error: 'No tienes permisos para modificar este empleado'
    });
    return;
  }
  // #end-step

  // #step 3 - Guardar companyId en req para uso posterior
  // Asegurar que req.body exista incluso en rutas GET
  if (!req.body) {
    // Express puede no inicializar body en GET; creamos un objeto seguro
    (req as unknown as { body: Record<string, unknown> }).body = {};
  }
  req.body.companyId = employeeData.company.id;
  // #end-step

  next();
};
// #end-middleware

// #middleware checkEmailUniqueness
/**
 * Verifica que el email no esté registrado en el sistema.
 * 
 * Debe ejecutarse DESPUÉS de validateCreateEmployeePayload.
 */
export const checkEmailUniqueness = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'El email ya está registrado'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware verifyBranchExistsAndOwnership
/**
 * Verifica que la sucursal exista y pertenezca a una compañía del admin.
 * 
 * Debe ejecutarse DESPUÉS de validateCreateEmployeePayload.
 * Lee branchId del body y verifica ownership via company.
 */
export const verifyBranchExistsAndOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { branchId } = req.body;
  const adminId = req.user?.userId;

  if (!adminId) {
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado'
    });
    return;
  }

  // #step 1 - Buscar sucursal con join a company
  const [branchData] = await db
    .select({
      branch: branchesTable,
      company: companiesTable
    })
    .from(branchesTable)
    .innerJoin(companiesTable, eq(branchesTable.companyId, companiesTable.id))
    .where(eq(branchesTable.id, branchId));

  if (!branchData) {
    res.status(404).json({
      success: false,
      error: 'Sucursal no encontrada'
    });
    return;
  }
  // #end-step

  // #step 2 - Verificar ownership
  if (branchData.company.ownerId !== adminId) {
    console.warn(
      `[verifyBranchExistsAndOwnership] Acceso denegado - Admin ID: ${adminId} intentó asignar empleado a sucursal ID: ${branchId} de compañía ID: ${branchData.company.id} (Owner: ${branchData.company.ownerId})`
    );
    res.status(403).json({
      success: false,
      error: 'No tienes permisos para asignar empleados a esta sucursal'
    });
    return;
  }
  // #end-step

  // #step 3 - Guardar companyId en req para uso posterior
  req.body.companyId = branchData.company.id;
  // #end-step

  next();
};
// #end-middleware
