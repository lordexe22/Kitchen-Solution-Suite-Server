/* src/routes/employees.routes.ts */

// #section Imports
import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../modules/jwtManager/jwtManager.types';
import { validateJWTAndGetPayload } from '../modules/jwtManager';
import { requireRole } from '../middlewares/authorization/authorization.middlewares';
import {
  validateCreateEmployeePayload,
  validateUpdatePermissionsPayload,
  verifyEmployeeOwnership,
  checkEmailUniqueness,
  verifyBranchExistsAndOwnership
} from '../middlewares/employees/employees.middlewares';
import {
  createEmployee,
  getEmployeePermissions,
  updateEmployeePermissions,
  listEmployees,
  deactivateEmployee
} from '../services/employees/employees.services';
// #end-section

// #variable router
const router = Router();
// #end-variable

// #route POST /employees
/**
 * Crea un nuevo empleado.
 * 
 * Solo admin puede crear empleados.
 * El empleado se asigna a una sucursal de la compañía del admin.
 * 
 * Body:
 * - email: string
 * - password: string
 * - firstName: string
 * - lastName: string
 * - branchId: number
 * - permissions: EmployeePermissions (opcional)
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede crear empleados
 * 3. validateCreateEmployeePayload - Valida formato de datos
 * 4. checkEmailUniqueness - Verifica que el email no esté registrado
 * 5. verifyBranchExistsAndOwnership - Verifica ownership de la sucursal
 */
router.post(
  '/',
  validateJWTAndGetPayload,
  requireRole('admin'),
  validateCreateEmployeePayload,
  checkEmailUniqueness,
  verifyBranchExistsAndOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.userId;
      const newEmployee = await createEmployee(req.body, adminId);

      res.status(201).json({
        success: true,
        data: newEmployee
      });
    } catch (error) {
      console.error('[POST /employees] Error al crear empleado:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear empleado'
      });
    }
  }
);
// #end-route

// #route GET /employees/:id/permissions
/**
 * Obtiene los permisos actuales de un empleado.
 * 
 * Solo admin puede obtener los permisos de un empleado.
 * El admin debe ser dueño de la compañía del empleado.
 * 
 * Params:
 * - id: number (employeeId)
 * 
 * Response:
 * - permissions: EmployeePermissions
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede ver permisos
 * 3. verifyEmployeeOwnership - Verifica ownership del empleado
 */
router.get(
  '/:id/permissions',
  validateJWTAndGetPayload,
  requireRole('admin'),
  verifyEmployeeOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id);
      const adminId = req.user!.userId;
      const permissions = await getEmployeePermissions(employeeId, adminId);

      res.status(200).json({
        success: true,
        data: { permissions }
      });
    } catch (error) {
      console.error('[GET /employees/:id/permissions] Error al obtener permisos:', error);
      
      if (error instanceof Error && error.message === 'Empleado no encontrado') {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error al obtener permisos'
      });
    }
  }
);
// #end-route

// #route PUT /employees/:id/permissions
/**
 * Actualiza los permisos de un empleado.
 * 
 * Solo admin puede actualizar permisos.
 * El admin debe ser dueño de la compañía del empleado.
 * 
 * Params:
 * - id: number (employeeId)
 * 
 * Body:
 * - permissions: EmployeePermissions
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede actualizar permisos
 * 3. validateUpdatePermissionsPayload - Valida formato de permisos
 * 4. verifyEmployeeOwnership - Verifica ownership del empleado
 */
router.put(
  '/:id/permissions',
  validateJWTAndGetPayload,
  requireRole('admin'),
  validateUpdatePermissionsPayload,
  verifyEmployeeOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id);
      const adminId = req.user!.userId;
      const updatedEmployee = await updateEmployeePermissions(
        employeeId,
        req.body,
        adminId
      );

      res.status(200).json({
        success: true,
        data: updatedEmployee
      });
    } catch (error) {
      console.error('[PUT /employees/:id/permissions] Error al actualizar permisos:', error);
      
      if (error instanceof Error && error.message === 'Empleado no encontrado') {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error al actualizar permisos'
      });
    }
  }
);
// #end-route

// #route GET /employees
/**
 * Lista empleados del admin autenticado.
 * 
 * Solo admin puede listar empleados.
 * Se filtran automáticamente por companyId del admin.
 * 
 * Query params (opcionales):
 * - branchId: number - Filtrar por sucursal específica
 * - state: 'pending' | 'active' | 'suspended' - Filtrar por estado
 * - isActive: boolean - Filtrar por activos (no soft-deleted)
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede listar empleados
 */
router.get(
  '/',
  validateJWTAndGetPayload,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Obtener companyId del admin
      // TODO: Esto requiere un join a companies para obtener el companyId
      // Por ahora, asumimos que el admin tiene una compañía
      // En producción, deberíamos hacer un query para obtener todas las companyIds del admin

      const filters = {
        branchId: req.query.branchId ? parseInt(req.query.branchId as string) : undefined,
        state: req.query.state as 'pending' | 'active' | 'suspended' | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        // companyId se debería obtener del admin, pero por ahora lo dejamos flexible
        companyId: req.query.companyId ? parseInt(req.query.companyId as string) : undefined
      };

      const employees = await listEmployees(filters);

      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('[GET /employees] Error al listar empleados:', error);
      res.status(500).json({
        success: false,
        error: 'Error al listar empleados'
      });
    }
  }
);
// #end-route

// #route DELETE /employees/:id
/**
 * Desactiva un empleado (soft delete).
 * 
 * Solo admin puede desactivar empleados.
 * El admin debe ser dueño de la compañía del empleado.
 * 
 * Params:
 * - id: number (employeeId)
 * 
 * Middlewares:
 * 1. validateJWTAndGetPayload - Autentica al usuario
 * 2. requireRole('admin') - Solo admin puede desactivar empleados
 * 3. verifyEmployeeOwnership - Verifica ownership del empleado
 */
router.delete(
  '/:id',
  validateJWTAndGetPayload,
  requireRole('admin'),
  verifyEmployeeOwnership,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const employeeId = parseInt(req.params.id);
      const adminId = req.user!.userId;
      await deactivateEmployee(employeeId, adminId);

      res.status(200).json({
        success: true,
        message: 'Empleado desactivado correctamente'
      });
    } catch (error) {
      console.error('[DELETE /employees/:id] Error al desactivar empleado:', error);
      
      if (error instanceof Error && error.message === 'Empleado no encontrado') {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error al desactivar empleado'
      });
    }
  }
);
// #end-route

export default router;
