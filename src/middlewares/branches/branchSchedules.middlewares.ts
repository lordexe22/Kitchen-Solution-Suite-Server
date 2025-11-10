/* src/middlewares/branches/branchSchedules.middlewares.ts */
// #section Imports
import { Response, NextFunction } from "express";
import { db } from "../../db/init";
import { branchSchedulesTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
// #end-section

// #variable VALID_DAYS
/**
 * Días de la semana válidos
 */
const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;
// #end-variable

// #function isValidTimeFormat
/**
 * Valida que un string tenga formato HH:MM (24 horas)
 * 
 * @param {string} time - Hora a validar
 * @returns {boolean} true si es válido
 */
const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};
// #end-function

// #middleware validateCreateSchedulePayload
/**
 * Middleware: validateCreateSchedulePayload
 * 
 * Valida los datos para crear/actualizar un horario.
 * - dayOfWeek: obligatorio, uno de los días válidos
 * - isClosed: obligatorio, boolean
 * - openTime: obligatorio si isClosed=false, formato HH:MM
 * - closeTime: obligatorio si isClosed=false, formato HH:MM
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateCreateSchedulePayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { dayOfWeek, openTime, closeTime, isClosed } = req.body;

  // Validar dayOfWeek (obligatorio)
  if (!dayOfWeek || typeof dayOfWeek !== 'string') {
    res.status(400).json({
      success: false,
      error: 'El día de la semana es obligatorio'
    });
    return;
  }

  if (!VALID_DAYS.includes(dayOfWeek.toLowerCase() as any)) {
    res.status(400).json({
      success: false,
      error: `Día no válido. Debe ser uno de: ${VALID_DAYS.join(', ')}`
    });
    return;
  }

  // Validar isClosed (obligatorio)
  if (typeof isClosed !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'El campo isClosed es obligatorio y debe ser booleano'
    });
    return;
  }

  // Si NO está cerrado, validar horarios
  if (!isClosed) {
    // Validar openTime
    if (!openTime || typeof openTime !== 'string') {
      res.status(400).json({
        success: false,
        error: 'La hora de apertura es obligatoria cuando el día está abierto'
      });
      return;
    }

    if (!isValidTimeFormat(openTime.trim())) {
      res.status(400).json({
        success: false,
        error: 'La hora de apertura debe tener formato HH:MM (ej: 09:00)'
      });
      return;
    }

    // Validar closeTime
    if (!closeTime || typeof closeTime !== 'string') {
      res.status(400).json({
        success: false,
        error: 'La hora de cierre es obligatoria cuando el día está abierto'
      });
      return;
    }

    if (!isValidTimeFormat(closeTime.trim())) {
      res.status(400).json({
        success: false,
        error: 'La hora de cierre debe tener formato HH:MM (ej: 18:00)'
      });
      return;
    }

    // Validar que closeTime sea posterior a openTime
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (closeMinutes <= openMinutes) {
      res.status(400).json({
        success: false,
        error: 'La hora de cierre debe ser posterior a la hora de apertura'
      });
      return;
    }
  }

  // Normalizar datos
  req.body = {
    dayOfWeek: dayOfWeek.toLowerCase().trim(),
    openTime: !isClosed && openTime ? openTime.trim() : null,
    closeTime: !isClosed && closeTime ? closeTime.trim() : null,
    isClosed
  };

  next();
};
// #end-middleware

// #middleware validateScheduleId
/**
 * Middleware: validateScheduleId
 * 
 * Valida que el ID del horario en los params sea un número válido.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar
 */
export const validateScheduleId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const scheduleId = Number(req.params.scheduleId);

  if (isNaN(scheduleId) || scheduleId <= 0) {
    res.status(400).json({
      success: false,
      error: 'ID de horario inválido'
    });
    return;
  }

  next();
};
// #end-middleware

// #middleware createBranchSchedule
/**
 * Middleware: createBranchSchedule
 * 
 * Crea un nuevo horario para una sucursal.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const createBranchSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { dayOfWeek, openTime, closeTime, isClosed } = req.body;

    // Verificar si ya existe un horario para este día
    const [existing] = await db
      .select()
      .from(branchSchedulesTable)
      .where(
        and(
          eq(branchSchedulesTable.branchId, branchId),
          eq(branchSchedulesTable.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Ya existe un horario para este día'
      });
      return;
    }

    // Crear el horario
    const [newSchedule] = await db
      .insert(branchSchedulesTable)
      .values({
        branchId,
        dayOfWeek,
        openTime,
        closeTime,
        isClosed
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        schedule: newSchedule
      }
    });
  } catch (error) {
    console.error('Error creando horario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el horario'
    });
  }
};
// #end-middleware

// #middleware getBranchSchedules
/**
 * Middleware: getBranchSchedules
 * 
 * Obtiene todos los horarios de una sucursal.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const getBranchSchedules = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);

    const schedules = await db
      .select()
      .from(branchSchedulesTable)
      .where(eq(branchSchedulesTable.branchId, branchId))
      .orderBy(branchSchedulesTable.dayOfWeek);

    res.status(200).json({
      success: true,
      data: {
        schedules
      }
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los horarios'
    });
  }
};
// #end-middleware

// #middleware updateBranchSchedule
/**
 * Middleware: updateBranchSchedule
 * 
 * Actualiza un horario existente.
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const updateBranchSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const scheduleId = Number(req.params.scheduleId);
    const { openTime, closeTime, isClosed } = req.body;

    const [updatedSchedule] = await db
      .update(branchSchedulesTable)
      .set({
        openTime,
        closeTime,
        isClosed,
        updatedAt: new Date()
      })
      .where(eq(branchSchedulesTable.id, scheduleId))
      .returning();

    if (!updatedSchedule) {
      res.status(404).json({
        success: false,
        error: 'Horario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        schedule: updatedSchedule
      }
    });
  } catch (error) {
    console.error('Error actualizando horario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el horario'
    });
  }
};
// #end-middleware

// #middleware deleteBranchSchedule
/**
 * Middleware: deleteBranchSchedule
 * 
 * Elimina un horario (hard delete).
 * Requiere que verifyBranchOwnership se ejecute antes.
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const deleteBranchSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const scheduleId = Number(req.params.scheduleId);

    const [deletedSchedule] = await db
      .delete(branchSchedulesTable)
      .where(eq(branchSchedulesTable.id, scheduleId))
      .returning();

    if (!deletedSchedule) {
      res.status(404).json({
        success: false,
        error: 'Horario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Horario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando horario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el horario'
    });
  }
};
// #end-middleware

// #middleware upsertBranchSchedules
/**
 * Middleware: upsertBranchSchedules
 * 
 * Crea o actualiza múltiples horarios de una vez (batch operation).
 * Útil para configurar todos los días de la semana en una sola operación.
 * 
 * Body: {
 *   schedules: [
 *     { dayOfWeek: 'monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
 *     { dayOfWeek: 'sunday', isClosed: true }
 *   ]
 * }
 * 
 * @param {AuthenticatedRequest} req - Request con user autenticado
 * @param {Response} res - Response de Express
 */
export const upsertBranchSchedules = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const branchId = Number(req.params.id);
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Debe proporcionar un array de horarios'
      });
      return;
    }

    // Validar cada horario
    for (const schedule of schedules) {
      if (!VALID_DAYS.includes(schedule.dayOfWeek?.toLowerCase())) {
        res.status(400).json({
          success: false,
          error: `Día no válido: ${schedule.dayOfWeek}`
        });
        return;
      }

      if (typeof schedule.isClosed !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'El campo isClosed debe ser booleano'
        });
        return;
      }

      if (!schedule.isClosed) {
        if (!schedule.openTime || !isValidTimeFormat(schedule.openTime)) {
          res.status(400).json({
            success: false,
            error: `Hora de apertura inválida para ${schedule.dayOfWeek}`
          });
          return;
        }

        if (!schedule.closeTime || !isValidTimeFormat(schedule.closeTime)) {
          res.status(400).json({
            success: false,
            error: `Hora de cierre inválida para ${schedule.dayOfWeek}`
          });
          return;
        }
      }
    }

    // Eliminar horarios existentes
    await db
      .delete(branchSchedulesTable)
      .where(eq(branchSchedulesTable.branchId, branchId));

    // Insertar nuevos horarios
    const newSchedules = await db
      .insert(branchSchedulesTable)
      .values(
        schedules.map((s) => ({
          branchId,
          dayOfWeek: s.dayOfWeek.toLowerCase(),
          openTime: s.isClosed ? null : s.openTime,
          closeTime: s.isClosed ? null : s.closeTime,
          isClosed: s.isClosed
        }))
      )
      .returning();

    res.status(200).json({
      success: true,
      data: {
        schedules: newSchedules
      }
    });
  } catch (error) {
    console.error('Error actualizando horarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar los horarios'
    });
  }
};
// #end-middleware