/* src/services/devTools/databaseCrud/delete.service.ts */

// #section Imports
import { db } from '../../../db/init';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { tableExists } from './schema-discovery.service';
import type { DevToolsResponse } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de eliminación (DELETE) para DevTools.
 * 
 * Responsabilidades:
 * - Eliminar un registro específico por ID
 * - Retornar confirmación de la eliminación
 * 
 * Independencia:
 * - Agnóstico respecto a qué tabla se use
 * - No valida lógica de negocio
 * - No implementa soft-delete (por ahora)
 */
// #end-info

// #function deleteRecord
/**
 * Elimina un registro específico de la tabla.
 * 
 * Nota: Esta es una eliminación FÍSICA (hard delete).
 * En el futuro se puede implementar soft-delete.
 * 
 * @param tableName - Nombre de la tabla
 * @param id - ID del registro a eliminar
 * @returns Respuesta confirmando la eliminación
 * 
 * @example
 * await deleteRecord('users', 5);
 * // Elimina el usuario con ID 5
 */
export async function deleteRecord(
  tableName: string,
  id: number | string
): Promise<DevToolsResponse> {
  try {
    // #step 1 - Validar tabla
    if (!tableExists(tableName)) {
      return {
        success: false,
        error: `Tabla no encontrada: ${tableName}`
      };
    }
    // #end-step

    // #step 2 - Obtener tabla del schema
    const tableObj = (schema as any)[`${tableName}Table`];
    if (!tableObj) {
      return {
        success: false,
        error: `No se pudo encontrar el objeto de tabla para: ${tableName}`
      };
    }
    // #end-step

    // #step 3 - Ejecutar delete
    const result = await db
      .delete(tableObj)
      .where(eq(tableObj.id, id as any))
      .returning();
    // #end-step

    // #step 4 - Retornar respuesta
    const resultArray = Array.isArray(result) ? result : [result];
    if (resultArray.length === 0) {
      return {
        success: false,
        error: `No se encontró registro con ID ${id} en tabla ${tableName}`
      };
    }

    return {
      success: true,
      data: {
        message: `Registro ${id} eliminado exitosamente`,
        deletedRecord: resultArray[0]
      },
      metadata: {
        recordsAffected: resultArray.length,
        timestamp: new Date()
      }
    };
    // #end-step
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Fallo al eliminar registro en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function

// #function deleteRecordBatch
/**
 * Elimina múltiples registros de la tabla.
 * 
 * Recibe un array de IDs a eliminar.
 * 
 * @param tableName - Nombre de la tabla
 * @param ids - Array de IDs a eliminar
 * @returns Respuesta con array de registros eliminados
 * 
 * @example
 * await deleteRecordBatch('users', [1, 2, 3, 5, 7]);
 * // Elimina usuarios con IDs 1, 2, 3, 5 y 7
 */
export async function deleteRecordBatch(
  tableName: string,
  ids: (number | string)[]
): Promise<DevToolsResponse> {
  try {
    // #step 1 - Validar tabla
    if (!tableExists(tableName)) {
      return {
        success: false,
        error: `Tabla no encontrada: ${tableName}`
      };
    }
    // #end-step

    // #step 2 - Validar datos
    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        error: 'ids debe ser un array no vacío'
      };
    }
    // #end-step

    // #step 3 - Obtener tabla del schema
    const tableObj = (schema as any)[`${tableName}Table`];
    if (!tableObj) {
      return {
        success: false,
        error: `No se pudo encontrar el objeto de tabla para: ${tableName}`
      };
    }
    // #end-step

    // #step 4 - Ejecutar deletes de manera secuencial
    const deletedRecords: any[] = [];

    for (const id of ids) {
      try {
        const result = await db
          .delete(tableObj)
          .where(eq(tableObj.id, id as any))
          .returning();

        const resultArray = Array.isArray(result) ? result : [result];
        if (resultArray.length > 0) {
          deletedRecords.push(resultArray[0]);
        }
      } catch (singleError) {
        // Continuar con el siguiente ID si uno falla
        console.error(`Error eliminando ID ${id}:`, singleError);
      }
    }
    // #end-step

    // #step 5 - Retornar respuesta
    return {
      success: true,
      data: {
        message: `${deletedRecords.length} registros eliminados exitosamente`,
        deletedRecords
      },
      metadata: {
        recordsAffected: deletedRecords.length,
        timestamp: new Date()
      }
    };
    // #end-step
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Fallo al eliminar registros en lote en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function
