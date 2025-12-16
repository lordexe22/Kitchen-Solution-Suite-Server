/* src/services/employees/permissions.utils.ts */

import type { EmployeePermissions, ModulePermissions } from '../../config/permissions.config';
import type { EmployeeDBPermissions } from './employees.types';
import { DEFAULT_EMPLOYEE_PERMISSIONS } from '../../config/permissions.config';

// #function dbPermissionsToAppFormat
/**
 * Convierte permisos de la BD (columnas booleanas) al formato de la aplicación.
 * 
 * @param dbPerms - Objeto con campos de la tabla employee_permissions
 * @returns EmployeePermissions en formato jerárquico
 */
export function dbPermissionsToAppFormat(dbPerms: EmployeeDBPermissions): EmployeePermissions {
  return {
    products: {
      canView: dbPerms.productsCanView,
      canEdit: dbPerms.productsCanEdit,
    },
    categories: {
      canView: dbPerms.categoriesCanView,
      canEdit: dbPerms.categoriesCanEdit,
    },
    schedules: {
      canView: dbPerms.schedulesCanView,
      canEdit: dbPerms.schedulesCanEdit,
    },
    socials: {
      canView: dbPerms.socialsCanView,
      canEdit: dbPerms.socialsCanEdit,
    },
  };
}
// #end-function

// #function appFormatToDBPermissions
/**
 * Convierte permisos del formato de aplicación a estructura para insertar/actualizar en BD.
 * 
 * @param appPerms - EmployeePermissions en formato jerárquico
 * @returns Objeto con campos para la tabla employee_permissions
 */
export function appFormatToDBPermissions(appPerms: EmployeePermissions): Record<string, boolean> {
  const products = appPerms.products || { canView: false, canEdit: false };
  const categories = appPerms.categories || { canView: false, canEdit: false };
  const schedules = appPerms.schedules || { canView: false, canEdit: false };
  const socials = appPerms.socials || { canView: false, canEdit: false };

  return {
    productsCanView: products.canView ?? false,
    productsCanEdit: products.canEdit ?? false,
    categoriesCanView: categories.canView ?? false,
    categoriesCanEdit: categories.canEdit ?? false,
    schedulesCanView: schedules.canView ?? false,
    schedulesCanEdit: schedules.canEdit ?? false,
    socialsCanView: socials.canView ?? false,
    socialsCanEdit: socials.canEdit ?? false,
  };
}
// #end-function

// #function getDefaultDBPermissions
/**
 * Retorna un objeto con permisos por defecto (todos false) para la tabla employee_permissions.
 * 
 * @returns Objeto con todos los permisos en false, listo para insertar
 */
export function getDefaultDBPermissions(): Record<string, boolean> {
  return appFormatToDBPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
}
// #end-function
