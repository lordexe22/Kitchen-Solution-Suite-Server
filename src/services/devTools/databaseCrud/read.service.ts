/* src/services/devTools/databaseCrud/read.service.ts */

// #section Imports
import { db } from '../../../db/init';
import * as schema from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { tableExists } from './schema-discovery.service';
import type { DevToolsResponse, FilterConditions } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de lectura (READ) para DevTools.
 * 
 * Responsabilidades:
 * - Obtener registros de cualquier tabla
 * - Aplicar filtros simples (igualdad)
 * - Retornar resultados en formato consistente
 * 
 * Independencia:
 * - Agnóstico respecto a qué tabla se use
 * - Filtros simples y directos (sin joins complejos por ahora)
 */
// #end-info

// #function readRecords
/**
 * Lee registros de una tabla con filtros opcionales.
 * 
 * Soporta filtros simples (igualdad). Ejemplo:
 * {
 *   type: 'admin',
 *   isActive: true,
 *   state: 'active'
 * }
 * 
 * @param tableName - Nombre de la tabla a leer
 * @param filters - Condiciones de filtro (opcional)
 * @returns Respuesta con array de registros
 * 
 * @example
 * // Obtener todos los usuarios
 * await readRecords('users');
 * 
 * // Obtener usuarios activos de tipo admin
 * await readRecords('users', { isActive: true, type: 'admin' });
 */
export async function readRecords(
  tableName: string,
  filters?: FilterConditions
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

    // #step 3 - Construir query
    let query: any = db.select().from(tableObj);

    // Aplicar filtros si existen
    if (filters && Object.keys(filters).length > 0) {
      const filterConditions = buildWhereConditions(tableObj, filters);
      if (filterConditions) {
        query = query.where(filterConditions);
      }
    }
    // #end-step

    // #step 4 - Ejecutar query
    const result = await query;
    // #end-step

    // #step 5 - Retornar respuesta
    return {
      success: true,
      data: result,
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
      error: `Fallo al leer registros de ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function

// #function readRecordById
/**
 * Lee un registro específico por su ID.
 * 
 * @param tableName - Nombre de la tabla
 * @param id - Identificador del registro
 * @returns Respuesta con un registro o null
 * 
 * @example
 * await readRecordById('users', 5);
 * // Retorna el usuario con ID 5
 */
export async function readRecordById(
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

    // #step 3 - Ejecutar query por ID
    // Asumir que el campo PK es 'id' (mejora futura: detectarlo del schema)
    const result = await db
      .select()
      .from(tableObj)
      .where(eq(tableObj.id, id as any));
    // #end-step

    // #step 4 - Retornar respuesta
    return {
      success: true,
      data: result[0] || null,
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
      error: `Fallo al leer registro ${id} de ${tableName}: ${errorMessage}`
    };
  }
}
// #end-function

// #function buildWhereConditions
/**
 * Construye una condición WHERE para Drizzle a partir de filtros simples.
 * 
 * Combina múltiples filtros con AND.
 * 
 * @param tableObj - Objeto de tabla de Drizzle
 * @param filters - Condiciones a aplicar
 * @returns Condición WHERE o undefined si no hay filtros
 */
function buildWhereConditions(tableObj: any, filters: FilterConditions): any {
  const filterEntries = Object.entries(filters);

  if (filterEntries.length === 0) return undefined;

  // Construir array de condiciones
  const conditions = filterEntries.map(([fieldName, value]) => {
    const column = tableObj[fieldName];

    if (!column) {
      throw new Error(`Campo no encontrado en tabla: ${fieldName}`);
    }

    return eq(column, value);
  });

  // Combinar con AND (todas las condiciones deben cumplirse)
  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}
// #end-function
