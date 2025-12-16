/* src/middlewares/authorization/authorization.middlewares.ts */

// #section Imports
import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../modules/jwtManager/jwtManager.types';
import type { UserType } from '../../modules/jwtManager/jwtManager.types';
import type { EmployeePermissions, PermissionAction } from '../../config/permissions.config';
import { hasPermission } from '../../config/permissions.config';
// #end-section

// #middleware requireRole
/**
 * Middleware: requireRole
 * 
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * Debe ejecutarse DESPUÉS de validateJWTAndGetPayload.
 * 
 * Bloquea la petición con 403 si el tipo de usuario no está en la lista permitida.
 * 
 * @param allowedRoles - Lista de tipos de usuario permitidos
 * @returns Middleware de Express
 * 
 * @example
 * // Solo admins y employees pueden acceder
 * router.post('/products', 
 *   validateJWTAndGetPayload,
 *   requireRole('admin', 'employee'),
 *   createProduct
 * );
 * 
 * @example
 * // Solo admins pueden acceder
 * router.delete('/companies/:id',
 *   validateJWTAndGetPayload,
 *   requireRole('admin'),
 *   deleteCompany
 * );
 */
export const requireRole = (...allowedRoles: UserType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userType = req.user?.type;
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!userType) {
      console.warn('[requireRole] Usuario no autenticado intentando acceder');
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    if (!allowedRoles.includes(userType)) {
      console.warn(
        `[requireRole] Acceso denegado - Usuario: ${email} (ID: ${userId}, Tipo: ${userType}) | Roles permitidos: [${allowedRoles.join(', ')}]`
      );
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
      return;
    }

    console.log(
      `[requireRole] ✓ Acceso permitido - Usuario: ${email} (Tipo: ${userType}) | Ruta: ${req.method} ${req.path}`
    );
    next();
  };
};
// #end-middleware

// #middleware requirePermission
/**
 * Middleware: requirePermission
 * 
 * Verifica que un empleado tenga un permiso específico.
 * Si el usuario es admin, siempre permite (bypass).
 * Si es employee, verifica el permiso en el JSON de permissions.
 * Si es guest/dev u otro, bloquea con 403.
 * 
 * Debe ejecutarse DESPUÉS de validateJWTAndGetPayload y requireRole.
 * 
 * @param module - Módulo a verificar (ej: 'products', 'categories')
 * @param action - Acción requerida ('canView' o 'canEdit', donde canEdit incluye crear/modificar/eliminar)
 * @returns Middleware de Express
 * 
 * @example
 * // Employee necesita permiso de edición en productos; admin bypass
 * router.put('/products/:id',
 *   validateJWTAndGetPayload,
 *   requireRole('admin', 'employee'),
 *   requirePermission('products', 'canEdit'),
 *   updateProduct
 * );
 * 
 * @example
 * // Employee necesita permiso de creación en categorías
 * router.post('/categories',
 *   validateJWTAndGetPayload,
 *   requireRole('admin', 'employee'),
 *   requirePermission('categories', 'canCreate'),
 *   createCategory
 * );
 */
export const requirePermission = (
  module: keyof EmployeePermissions,
  action: PermissionAction
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const { type, permissions, email, userId } = req.user || {};

    console.log(`\n📋 [requirePermission] START - Module: ${module}, Action: ${action}`);
    console.log(`  - userType: ${type}`);
    console.log(`  - email: ${email}`);
    console.log(`  - userId: ${userId}`);

    // Admin siempre tiene todos los permisos (bypass)
    if (type === 'admin') {
      console.log(
        `  ✅ Admin bypass - Permiso: ${module}.${action}`
      );
      next();
      return;
    }

    // Employee debe tener el permiso específico
    if (type === 'employee') {
      console.log(`  - Checking EMPLOYEE permissions...`);
      console.log(`  - Raw permissions from JWT (type):`, typeof permissions);
      console.log(`  - Raw permissions from JWT:`, permissions);

      let employeePermissions: EmployeePermissions | null = null;

      // Si permissions ya es un objeto (parseado por JWT), usarlo directamente
      // Si es string, parsearlo
      if (typeof permissions === 'string') {
        try {
          employeePermissions = JSON.parse(permissions);
          console.log(`  - Parsed permissions from string:`, employeePermissions);
        } catch (error) {
          console.error(
            `  ❌ Error parsing permissions - Usuario: ${email} (ID: ${userId})`,
            error
          );
          res.status(500).json({
            success: false,
            error: 'Error al verificar permisos'
          });
          return;
        }
      } else if (permissions) {
        // Ya es un objeto
        employeePermissions = permissions as any as EmployeePermissions;
        console.log(`  - Permissions already parsed (object):`, employeePermissions);
      }

      // Verificar permiso usando la utilidad
      const hasAccess = hasPermission(employeePermissions, module, action);
      console.log(`  - hasPermission result for ${module}.${action}:`, hasAccess);
      
      if (hasAccess) {
        console.log(
          `  ✅ Permiso concedido - Permiso: ${module}.${action}`
        );
        next();
        return;
      }

      console.warn(
        `  ❌ Permiso denegado - Permiso requerido: ${module}.${action}`
      );
      res.status(403).json({
        success: false,
        error: `No tienes permiso para ${action} en ${module}`
      });
      return;
    }

    // Otros roles (guest, dev) no tienen permisos de escritura
    console.warn(
      `[requirePermission] Acceso denegado - Usuario: ${email} (Tipo: ${type}) | Permiso requerido: ${module}.${action}`
    );
    res.status(403).json({
      success: false,
      error: 'No tienes permisos para realizar esta acción'
    });
  };
};
// #end-middleware

// #middleware requireBranchAccess
/**
 * Middleware: requireBranchAccess
 * 
 * PLACEHOLDER - Este middleware se implementará después de crear
 * verifyEmployeeBranchAccess en branches.middlewares.ts.
 * 
 * Verificará acceso a sucursal según tipo de usuario:
 * - admin: delega a verifyBranchOwnership (ownership via company)
 * - employee: delega a verifyEmployeeBranchAccess (branchId match)
 * - otros: bloquea con 403
 * 
 * Por ahora, este archivo solo contiene los middlewares de rol/permiso.
 * La composición requireBranchAccess se añadirá en el siguiente paso.
 */
// #end-middleware
