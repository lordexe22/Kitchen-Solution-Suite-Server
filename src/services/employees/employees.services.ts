/* src/services/employees/employees.services.ts */

// #section Imports
import { db } from '../../db/init';
import { usersTable, companiesTable, branchesTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type {
  EmployeeCreateDTO,
  EmployeeUpdatePermissionsDTO,
  EmployeeListFilters,
  EmployeeResponse
} from './employees.types';
import type { User } from '../../db/schema.types';
// #end-section

// #function createEmployee
/**
 * Crea un nuevo empleado en el sistema.
 * 
 * Validaciones previas (deben hacerse en middleware):
 * - Admin debe ser dueño de la compañía (companyId)
 * - La sucursal debe pertenecer a esa compañía
 * - El email no debe estar registrado
 * 
 * @param data - DTO con datos del empleado
 * @param adminId - ID del admin que crea el empleado (para logs)
 * @returns Datos del empleado creado (sin password)
 * @throws Error si falla la creación
 */
export const createEmployee = async (
  data: EmployeeCreateDTO,
  adminId: number
): Promise<EmployeeResponse> => {
  // #step 1 - Hash de la contraseña
  const passwordHash = await bcrypt.hash(data.password, 10);
  // #end-step

  // #step 2 - Stringify de permisos
  const permissionsJson = JSON.stringify(data.permissions);
  // #end-step

  // #step 3 - Inserción en base de datos
  const [newEmployee] = await db
    .insert(usersTable)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      type: 'employee',
      branchId: data.branchId,
      permissions: permissionsJson,
      state: 'active',
      isActive: true
    })
    .returning();
  // #end-step

  // #step 4 - Log informativo
  console.log(
    `[createEmployee] ✓ Empleado creado - ID: ${newEmployee.id} | Email: ${newEmployee.email} | Branch: ${data.branchId} | Creado por Admin ID: ${adminId}`
  );
  // #end-step

  // #step 5 - Retornar respuesta sin password
  return {
    id: newEmployee.id,
    email: newEmployee.email,
    firstName: newEmployee.firstName,
    lastName: newEmployee.lastName,
    type: 'employee',
    branchId: newEmployee.branchId!,
    permissions: data.permissions,
    state: newEmployee.state,
    isActive: newEmployee.isActive,
    createdAt: newEmployee.createdAt,
    updatedAt: newEmployee.updatedAt
  };
  // #end-step
};
// #end-function

// #function updateEmployeePermissions
/**
 * Actualiza los permisos de un empleado existente.
 * 
 * Validaciones previas (deben hacerse en middleware):
 * - Admin debe ser dueño de la compañía del empleado
 * - El usuario debe existir y ser tipo 'employee'
 * 
 * @param employeeId - ID del empleado a actualizar
 * @param data - DTO con nuevos permisos
 * @param adminId - ID del admin que actualiza (para logs)
 * @returns Datos actualizados del empleado
 * @throws Error si el empleado no existe o no es tipo employee
 */
export const updateEmployeePermissions = async (
  employeeId: number,
  data: EmployeeUpdatePermissionsDTO,
  adminId: number
): Promise<EmployeeResponse> => {
  // #step 1 - Verificar que el usuario existe y es employee
  const [employee] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, employeeId),
        eq(usersTable.type, 'employee')
      )
    );

  if (!employee) {
    throw new Error('Empleado no encontrado');
  }
  // #end-step

  // #step 2 - Stringify de nuevos permisos
  const permissionsJson = JSON.stringify(data.permissions);
  // #end-step

  // #step 3 - Actualizar permisos
  const [updatedEmployee] = await db
    .update(usersTable)
    .set({
      permissions: permissionsJson,
      updatedAt: new Date()
    })
    .where(eq(usersTable.id, employeeId))
    .returning();
  // #end-step

  // #step 4 - Log informativo
  console.log(
    `[updateEmployeePermissions] ✓ Permisos actualizados - Employee ID: ${employeeId} | Actualizado por Admin ID: ${adminId}`
  );
  // #end-step

  // #step 5 - Retornar respuesta
  return {
    id: updatedEmployee.id,
    email: updatedEmployee.email,
    firstName: updatedEmployee.firstName,
    lastName: updatedEmployee.lastName,
    type: 'employee',
    branchId: updatedEmployee.branchId!,
    permissions: data.permissions,
    state: updatedEmployee.state,
    isActive: updatedEmployee.isActive,
    createdAt: updatedEmployee.createdAt,
    updatedAt: updatedEmployee.updatedAt
  };
  // #end-step
};
// #end-function

// #function listEmployees
/**
 * Lista empleados según filtros aplicados.
 * 
 * Si el admin consulta, se filtran por companyId automáticamente.
 * Permite filtrar por sucursal, estado, etc.
 * 
 * @param filters - Filtros de búsqueda
 * @returns Lista de empleados con permisos parseados
 */
export const listEmployees = async (
  filters: EmployeeListFilters
): Promise<EmployeeResponse[]> => {
  // #step 1 - Construir condiciones de filtrado
  const conditions = [eq(usersTable.type, 'employee')];

  if (filters.branchId) {
    conditions.push(eq(usersTable.branchId, filters.branchId));
  }

  if (filters.state) {
    conditions.push(eq(usersTable.state, filters.state));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(usersTable.isActive, filters.isActive));
  }
  // #end-step

  // #step 2 - Query con join para filtrar por companyId
  let query = db
    .select({
      user: usersTable
    })
    .from(usersTable)
    .where(and(...conditions));

  // Si se especifica companyId, hacer join con branches
  if (filters.companyId) {
    query = db
      .select({
        user: usersTable
      })
      .from(usersTable)
      .innerJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
      .where(
        and(
          ...conditions,
          eq(branchesTable.companyId, filters.companyId)
        )
      ) as typeof query;
  }

  const employees = await query;
  // #end-step

  // #step 3 - Mapear a EmployeeResponse
  return employees.map((row: { user: User }) => {
    const employee = row.user;
    return {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      type: 'employee',
      branchId: employee.branchId!,
      permissions: employee.permissions ? JSON.parse(employee.permissions) : null,
      state: employee.state,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };
  });
  // #end-step
};
// #end-function

// #function deactivateEmployee
/**
 * Desactiva un empleado (soft delete).
 * 
 * No elimina el registro, solo marca isActive = false.
 * Esto preserva histórico y evita violaciones de FK.
 * 
 * Validaciones previas (deben hacerse en middleware):
 * - Admin debe ser dueño de la compañía del empleado
 * - El usuario debe existir y ser tipo 'employee'
 * 
 * @param employeeId - ID del empleado a desactivar
 * @param adminId - ID del admin que desactiva (para logs)
 * @throws Error si el empleado no existe
 */
export const deactivateEmployee = async (
  employeeId: number,
  adminId: number
): Promise<void> => {
  // #step 1 - Verificar que el usuario existe y es employee
  const [employee] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, employeeId),
        eq(usersTable.type, 'employee')
      )
    );

  if (!employee) {
    throw new Error('Empleado no encontrado');
  }
  // #end-step

  // #step 2 - Soft delete (isActive = false)
  await db
    .update(usersTable)
    .set({
      isActive: false,
      state: 'suspended',
      updatedAt: new Date()
    })
    .where(eq(usersTable.id, employeeId));
  // #end-step

  // #step 3 - Log informativo
  console.log(
    `[deactivateEmployee] ✓ Empleado desactivado - ID: ${employeeId} | Email: ${employee.email} | Desactivado por Admin ID: ${adminId}`
  );
  // #end-step
};
// #end-function
