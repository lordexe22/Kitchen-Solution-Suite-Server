/* src/services/employees/employees.services.ts */

// #section Imports
import { db } from '../../db/init';
import { usersTable, companiesTable, branchesTable, employeePermissionsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type {
  EmployeeCreateDTO,
  EmployeeUpdatePermissionsDTO,
  EmployeeListFilters,
  EmployeeResponse,
  EmployeeDBPermissions
} from './employees.types';
import { dbPermissionsToAppFormat, appFormatToDBPermissions, getDefaultDBPermissions } from './permissions.utils';
import { DEFAULT_EMPLOYEE_PERMISSIONS } from '../../config/permissions.config';
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

  // #step 2 - Inserción de usuario en la BD
  const [newUser] = await db
    .insert(usersTable)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      type: 'employee',
      branchId: data.branchId,
      state: 'active',
      isActive: true
    })
    .returning();
  // #end-step

  // #step 3 - Inserción de permisos en tabla employee_permissions
  const dbPerms = appFormatToDBPermissions(data.permissions);
  await db
    .insert(employeePermissionsTable)
    .values({
      userId: newUser.id,
      ...dbPerms
    });
  // #end-step

  // #step 4 - Log informativo
  console.log(
    `[createEmployee] ✓ Empleado creado - ID: ${newUser.id} | Email: ${newUser.email} | Branch: ${data.branchId} | Creado por Admin ID: ${adminId}`
  );
  // #end-step

  // #step 5 - Retornar respuesta sin password
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    type: 'employee',
    branchId: newUser.branchId!,
    permissions: data.permissions,
    state: newUser.state,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  };
  // #end-step
};
// #end-function

// #function getEmployeePermissions
/**
 * Obtiene los permisos actuales de un empleado.
 * 
 * Validaciones previas (deben hacerse en middleware):
 * - Admin debe ser dueño de la compañía del empleado
 * - El usuario debe existir y ser tipo 'employee'
 * 
 * @param employeeId - ID del empleado
 * @param adminId - ID del admin que consulta (para logs)
 * @returns Permisos del empleado en formato de aplicación
 * @throws Error si el empleado no existe o no tiene permisos
 */
export const getEmployeePermissions = async (
  employeeId: number,
  adminId: number
) => {
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

  // #step 2 - Obtener permisos de la tabla employee_permissions
  const [perms] = await db
    .select()
    .from(employeePermissionsTable)
    .where(eq(employeePermissionsTable.userId, employeeId));

  // Si no tiene permisos registrados, retornar permisos por defecto
  if (!perms) {
    console.log(
      `[getEmployeePermissions] ⚠ No hay permisos registrados para Employee ID: ${employeeId} - Retornando permisos por defecto`
    );
    return { ...DEFAULT_EMPLOYEE_PERMISSIONS };
  }
  console.log(`[getEmployeePermissions] 📋 Permisos raw de BD:`, JSON.stringify(perms, null, 2));
  // #end-step

  // #step 3 - Convertir permisos de BD a formato de aplicación
  const appPermissions = dbPermissionsToAppFormat(perms as EmployeeDBPermissions);
  console.log(`[getEmployeePermissions] 🔄 Permisos convertidos a formato app:`, JSON.stringify(appPermissions, null, 2));
  // #end-step

  // #step 4 - Log informativo
  console.log(
    `[getEmployeePermissions] ✓ Permisos consultados - Employee ID: ${employeeId} | Consultado por Admin ID: ${adminId}`
  );
  // #end-step

  return appPermissions;
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

  // #step 2 - Convertir permisos al formato de BD
  const dbPerms = appFormatToDBPermissions(data.permissions);
  console.log(`[updateEmployeePermissions] 📝 Permisos recibidos del cliente:`, JSON.stringify(data.permissions, null, 2));
  console.log(`[updateEmployeePermissions] 🔄 Permisos convertidos a formato BD:`, JSON.stringify(dbPerms, null, 2));
  // #end-step

  // #step 3 - Actualizar permisos en tabla employee_permissions
  const [updatedPerms] = await db
    .update(employeePermissionsTable)
    .set({
      ...dbPerms,
      updatedAt: new Date()
    })
    .where(eq(employeePermissionsTable.userId, employeeId))
    .returning();

  // Si no existe, crear el registro
  if (!updatedPerms) {
    console.log(`[updateEmployeePermissions] ℹ️ No existían permisos previos, insertando nuevos`);
    await db
      .insert(employeePermissionsTable)
      .values({
        userId: employeeId,
        ...dbPerms
      });
  } else {
    console.log(`[updateEmployeePermissions] ✅ Permisos actualizados en BD:`, JSON.stringify(updatedPerms, null, 2));
  }
  // #end-step

  // #step 4 - Log informativo
  console.log(
    `[updateEmployeePermissions] ✓ Permisos actualizados - Employee ID: ${employeeId} | Actualizado por Admin ID: ${adminId}`
  );
  // #end-step

  // #step 5 - Retornar respuesta
  return {
    id: employee.id,
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    type: 'employee',
    branchId: employee.branchId!,
    permissions: data.permissions,
    state: employee.state,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
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

  // #step 3 - Para cada empleado, obtener sus permisos de la tabla employee_permissions
  const results: EmployeeResponse[] = [];
  for (const row of employees) {
    const employee = row.user;
    const [permRecord] = await db
      .select()
      .from(employeePermissionsTable)
      .where(eq(employeePermissionsTable.userId, employee.id));

    const permissions = permRecord 
      ? dbPermissionsToAppFormat(permRecord as unknown as EmployeeDBPermissions)
      : { products: {}, categories: {}, schedules: {}, socials: {} };

    results.push({
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      type: 'employee',
      branchId: employee.branchId!,
      permissions,
      state: employee.state,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    });
  }

  return results;
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
