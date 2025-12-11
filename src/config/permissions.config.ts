/* src/config/permissions.config.ts */

// #section Imports
// #end-section

// #const EMPLOYEE_PERMISSION_MODULES
/**
 * Módulos del sistema sobre los que se pueden asignar permisos.
 * 
 * Cada módulo representa una sección de la sucursal que el empleado
 * podría gestionar según los permisos otorgados por el administrador.
 * 
 * @example
 * // Verificar si un empleado tiene acceso a productos
 * if (permissions[EMPLOYEE_PERMISSION_MODULES.PRODUCTS]?.canEdit) {
 *   // Permitir edición de productos
 * }
 */
export const EMPLOYEE_PERMISSION_MODULES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SCHEDULES: 'schedules',
  SOCIALS: 'socials',
  LOCATION: 'location',
  BRANCH_INFO: 'branchInfo',
} as const;
// #end-const

// #type PermissionAction
/**
 * Acciones posibles sobre cada módulo.
 * 
 * - canView: Permiso de lectura/visualización
 * - canCreate: Permiso para crear nuevos recursos
 * - canEdit: Permiso para modificar recursos existentes
 * - canDelete: Permiso para eliminar recursos
 * 
 * No todos los módulos soportan todas las acciones.
 * Por ejemplo, 'location' y 'branchInfo' solo tienen canView y canEdit.
 */
export type PermissionAction = 'canView' | 'canCreate' | 'canEdit' | 'canDelete';
// #end-type

// #type ModulePermissions
/**
 * Estructura de permisos para un módulo específico.
 * Todas las acciones son opcionales (undefined = sin permiso).
 */
export interface ModulePermissions {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}
// #end-type

// #type EmployeePermissions
/**
 * Estructura completa de permisos de un empleado.
 * 
 * Cada módulo puede tener permisos granulares de lectura/escritura.
 * Por defecto, un empleado nuevo no tiene permisos (todo false/undefined).
 * 
 * El objeto se almacena como JSON stringificado en la columna 'permissions'
 * de la tabla users (solo para type='employee').
 * 
 * @example
 * const permissions: EmployeePermissions = {
 *   products: { canView: true, canCreate: true, canEdit: true, canDelete: false },
 *   schedules: { canView: true, canEdit: true },
 *   categories: { canView: true },
 * };
 * 
 * // Almacenar en BD
 * user.permissions = JSON.stringify(permissions);
 * 
 * // Recuperar de BD
 * const userPermissions = JSON.parse(user.permissions) as EmployeePermissions;
 */
export interface EmployeePermissions {
  products?: ModulePermissions;
  categories?: ModulePermissions;
  schedules?: ModulePermissions;
  socials?: ModulePermissions;
  location?: Omit<ModulePermissions, 'canCreate' | 'canDelete'>; // Solo view y edit
  branchInfo?: Omit<ModulePermissions, 'canCreate' | 'canDelete'>; // Solo view y edit
}
// #end-type

// #const DEFAULT_EMPLOYEE_PERMISSIONS
/**
 * Permisos por defecto para un empleado nuevo.
 * 
 * Configuración conservadora:
 * - Solo lectura en productos, categorías e información de sucursal
 * - Sin acceso a horarios, redes sociales ni ubicación
 * - Sin permisos de escritura en ningún módulo
 * 
 * El administrador debe actualizar los permisos según las responsabilidades
 * del empleado.
 */
export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  products: { 
    canView: true, 
    canCreate: false, 
    canEdit: false, 
    canDelete: false 
  },
  categories: { 
    canView: true, 
    canCreate: false, 
    canEdit: false, 
    canDelete: false 
  },
  schedules: { 
    canView: false, 
    canCreate: false, 
    canEdit: false, 
    canDelete: false 
  },
  socials: { 
    canView: false, 
    canCreate: false, 
    canEdit: false, 
    canDelete: false 
  },
  location: { 
    canView: false, 
    canEdit: false 
  },
  branchInfo: { 
    canView: true, 
    canEdit: false 
  },
};
// #end-const

// #function hasPermission
/**
 * Verifica si un conjunto de permisos incluye una acción específica en un módulo.
 * 
 * Utilidad para validar permisos de manera segura.
 * Retorna false si el módulo no existe o la acción no está permitida.
 * 
 * @param permissions - Objeto de permisos del empleado (puede ser null/undefined)
 * @param module - Módulo a verificar (ej: 'products', 'categories')
 * @param action - Acción a verificar (ej: 'canEdit', 'canDelete')
 * @returns true si el permiso está explícitamente en true, false caso contrario
 * 
 * @example
 * const permissions = JSON.parse(user.permissions) as EmployeePermissions;
 * 
 * if (hasPermission(permissions, 'products', 'canEdit')) {
 *   // Permitir edición de productos
 * }
 * 
 * if (hasPermission(permissions, 'categories', 'canDelete')) {
 *   // Permitir eliminación de categorías
 * }
 */
export function hasPermission(
  permissions: EmployeePermissions | null | undefined,
  module: keyof EmployeePermissions,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  
  const modulePermissions = permissions[module];
  if (!modulePermissions) return false;
  
  // Type guard: verificar que la acción existe en el módulo
  if (!(action in modulePermissions)) return false;
  
  return modulePermissions[action as keyof typeof modulePermissions] === true;
}
// #end-function
