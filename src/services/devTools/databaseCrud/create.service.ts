/* src/services/devTools/create.service.ts */

// #section Imports
import { db } from '../../../db/init';
import * as schema from '../../../db/schema';
import { tableExists, getTableSchema } from './schema-discovery.service';
import type { DevToolsResponse } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de creación (CREATE) para DevTools.
 * 
 * Responsabilidades:
 * - Insertar un registro en cualquier tabla del schema
 * - Validar que la tabla exista
 * - Retornar el registro creado
 * 
 * Independencia:
 * - Agnóstico respecto a qué tabla se use
 * - No valida lógica de negocio (solo tipo de datos básicos)
 * - No maneja autenticación/autorización
 */
// #end-info

// #function createRecord
/**
 * Crea un nuevo registro en la tabla especificada.
 * 
 * @param tableName - Nombre de la tabla donde insertar
 * @param data - Objeto con los datos a insertar
 * @returns Respuesta con el registro creado
 * 
 * @example
 * await createRecord('users', {
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   email: 'juan@example.com',
 *   passwordHash: 'hash...',
 *   type: 'admin'
 * });
 */
export async function createRecord(
  tableName: string,
  data: Record<string, any>
): Promise<DevToolsResponse> {
  try {
    // #step 1 - Validar que la tabla existe
    if (!tableExists(tableName)) {
      return {
        success: false,
        error: `Tabla no encontrada: ${tableName}`
      };
    }
    // #end-step

    // #step 2 - Obtener la tabla del schema
    const tableObj = (schema as any)[`${tableName}Table`];
    if (!tableObj) {
      return {
        success: false,
        error: `No se pudo encontrar el objeto de tabla para: ${tableName}`
      };
    }
    // #end-step

    // #step 3 - Ejecutar insert
    const result = await db
      .insert(tableObj)
      .values(data)
      .returning();
    // #end-step

    // #step 4 - Retornar respuesta
    const resultArray = Array.isArray(result) ? result : [result];
    return {
      success: true,
      data: resultArray[0] || result,
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
      error: `Fallo al crear registro en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function

// #function createRecordBatch
/**
 * Crea múltiples registros en la tabla especificada.
 * 
 * Útil para insertar muchos registros de una vez (ej: datos de prueba).
 * 
 * @param tableName - Nombre de la tabla
 * @param dataArray - Array de objetos con los datos a insertar
 * @returns Respuesta con los registros creados
 * 
 * @example
 * await createRecordBatch('users', [
 *   { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com', ... },
 *   { firstName: 'María', lastName: 'García', email: 'maria@example.com', ... },
 * ]);
 */
export async function createRecordBatch(
  tableName: string,
  dataArray: Record<string, any>[]
): Promise<DevToolsResponse> {
  try {
    // #step 1 - Validar inputs
    if (!tableExists(tableName)) {
      return {
        success: false,
        error: `Tabla no encontrada: ${tableName}`
      };
    }

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return {
        success: false,
        error: 'dataArray debe ser un array no vacío'
      };
    }
    // #end-step

    // #step 2 - Obtener la tabla
    const tableObj = (schema as any)[`${tableName}Table`];
    if (!tableObj) {
      return {
        success: false,
        error: `No se pudo encontrar el objeto de tabla para: ${tableName}`
      };
    }
    // #end-step

    // #step 3 - Ejecutar insert en lote
    const result = await db
      .insert(tableObj)
      .values(dataArray)
      .returning();
    // #end-step

    // #step 4 - Retornar respuesta
    const resultArray = Array.isArray(result) ? result : [result];
    return {
      success: true,
      data: resultArray,
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
      error: `Fallo al crear registros en lote en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function
