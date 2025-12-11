/* src/services/employees/employees.types.ts */

// #section Imports
import type { EmployeePermissions } from '../../config/permissions.config';
// #end-section

// #type EmployeeCreateDTO
/**
 * DTO para crear un nuevo empleado.
 * 
 * Campos requeridos:
 * - email, password, firstName, lastName: Datos básicos
 * - branchId: Sucursal a la que pertenece
 * - companyId: Usado para verificar ownership (admin debe ser dueño)
 * - permissions: Permisos granulares del empleado
 */
export interface EmployeeCreateDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  branchId: number;
  companyId: number;
  permissions: EmployeePermissions;
}
// #end-type

// #type EmployeeUpdatePermissionsDTO
/**
 * DTO para actualizar permisos de un empleado existente.
 * 
 * Solo se actualizan los permisos; otros datos requieren endpoint distinto.
 */
export interface EmployeeUpdatePermissionsDTO {
  permissions: EmployeePermissions;
}
// #end-type

// #type EmployeeListFilters
/**
 * Filtros para listar empleados.
 * 
 * - branchId: Filtrar por sucursal específica
 * - companyId: Filtrar por empresa (admin lista de su empresa)
 * - state: Filtrar por estado (active, suspended, pending)
 * - isActive: Filtrar por empleados activos (no soft-deleted)
 */
export interface EmployeeListFilters {
  branchId?: number;
  companyId?: number;
  state?: 'pending' | 'active' | 'suspended';
  isActive?: boolean;
}
// #end-type

// #type EmployeeResponse
/**
 * Respuesta al crear/obtener un empleado.
 * 
 * No incluye password por seguridad.
 */
export interface EmployeeResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  type: 'employee';
  branchId: number;
  permissions: EmployeePermissions;
  state: 'pending' | 'active' | 'suspended';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// #end-type
