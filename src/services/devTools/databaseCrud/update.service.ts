/* src/services/devTools/databaseCrud/update.service.ts */

// #section Imports
import { db } from '../../../db/init';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { tableExists } from './schema-discovery.service';
import type { DevToolsResponse } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de actualización (UPDATE) para DevTools.
 * 
 * Responsabilidades:
 * - Actualizar un registro específico por ID
 * - Retornar el registro actualizado
 * 
 * Independencia:
 * - Agnóstico respecto a qué tabla se use
 * - No valida lógica de negocio
 */
// #end-info

// #function updateRecord
/**
 * @description Actualiza un registro específico en la tabla con los campos proporcionados.
 * @purpose Proveer la operación de UPDATE agnóstica de tabla para modificar datos de prueba en el sistema devTools.
 * @context Utilizado por el devTools del servidor para actualizar registros de cualquier tabla del schema.
 * @param tableName nombre de la tabla
 * @param id ID del registro a actualizar
 * @param data objeto con los campos a actualizar (updatedAt se establece automáticamente si existe)
 * @returns respuesta con el registro actualizado o error descriptivo
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export async function updateRecord(
  tableName: string,
  id: number | string,
  data: Record<string, any>
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
    if (!data || Object.keys(data).length === 0) {
      return {
        success: false,
        error: 'data debe contener al menos un campo para actualizar'
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

    // #step 4 - Actualizar updatedAt si existe en la tabla
    const updateData = { ...data };
    if (tableObj.updatedAt) {
      updateData.updatedAt = new Date();
    }
    // #end-step

    // #step 5 - Ejecutar update
    const result = await db
      .update(tableObj)
      .set(updateData)
      .where(eq(tableObj.id, id as any))
      .returning();
    // #end-step

    // #step 6 - Retornar respuesta
    if (result.length === 0) {
      return {
        success: false,
        error: `No se encontró registro con ID ${id} en tabla ${tableName}`
      };
    }

    return {
      success: true,
      data: result[0],
      metadata: {
        recordsAffected: result.length,
        timestamp: new Date()
      }
    };
    // #end-step
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Fallo al actualizar registro en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function

// #function updateRecordBatch
/**
 * @description Actualiza múltiples registros en la tabla de forma secuencial en una operación de batch.
 * @purpose Proveer la operación de UPDATE masivo para modificar grandes volúmenes de datos de prueba.
 * @context Utilizado por el devTools del servidor para actualizar múltiples registros de cualquier tabla.
 * @param tableName nombre de la tabla
 * @param updates array de objetos con id y los campos a actualizar por cada registro
 * @returns respuesta con los registros actualizados o error descriptivo
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export async function updateRecordBatch(
  tableName: string,
  updates: Array<{ id: number | string; [key: string]: any }>
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
    if (!Array.isArray(updates) || updates.length === 0) {
      return {
        success: false,
        error: 'updates debe ser un array no vacío'
      };
    }

    const invalidUpdates = updates.filter(u => !u.id);
    if (invalidUpdates.length > 0) {
      return {
        success: false,
        error: 'Todos los items en updates deben tener un campo id'
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

    // #step 4 - Ejecutar updates de manera secuencial
    const results: any[] = [];

    for (const update of updates) {
      const { id, ...fields } = update;

      // Agregar updatedAt si existe
      if (tableObj.updatedAt) {
        fields.updatedAt = new Date();
      }

      const result = await db
        .update(tableObj)
        .set(fields)
        .where(eq(tableObj.id, id as any))
        .returning();

      if (result.length > 0) {
        results.push(result[0]);
      }
    }
    // #end-step

    // #step 5 - Retornar respuesta
    return {
      success: true,
      data: results,
      metadata: {
        recordsAffected: results.length,
        timestamp: new Date()
      }
    };
    // #end-step
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return {
      success: false,
      error: `Fallo al actualizar registros en lote en ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function
