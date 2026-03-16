/* src/services/company/checkCompanyPermission/checkCompanyPermission.types.ts */

// #interface PermissionCheckResult - Resultado de verificación de permisos sobre una compañía
/**
 * @description
 * Resultado de la verificación de permisos de un usuario sobre una compañía específica.
 *
 * @purpose
 * Encapsular el resultado del chequeo de autorización indicando si el acceso es permitido
 * y la razón en caso de denegación.
 *
 * @context
 * Utilizado por checkCompanyPermissionService dentro de la capa de servicios del backend
 * para controlar el acceso a operaciones sobre compañías.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface PermissionCheckResult {
  // #v-field hasPermission - indica si el usuario tiene permiso
  /** true si el usuario tiene autorización para operar sobre la compañía */
  hasPermission: boolean;
  // #end-v-field
  // #v-field reason - motivo de la denegación (opcional)
  /** descripción del motivo por el que se denegó el acceso; presente solo cuando hasPermission es false */
  reason?: string;
  // #end-v-field
}
// #end-interface
