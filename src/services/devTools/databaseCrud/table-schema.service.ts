/**
 * Servicio de Extracción de Schema de Tablas
 * 
 * Responsabilidad: Extraer información completa de los campos de cualquier tabla Drizzle
 * Proporciona una interfaz consistente para acceder a metadata de columnas
 */

import { getTableColumns } from 'drizzle-orm';
import type { TableFieldInfo, TableSchema } from './devTools.types';

/**
 * Extrae información completa de una columna Drizzle
 * 
 * @param fieldName - Nombre del campo
 * @param columnConfig - Objeto columna de Drizzle
 * @returns Información estructurada del campo
 */
export function extractFieldInfo(fieldName: string, columnConfig: any): TableFieldInfo {
  // La columnConfig de Drizzle ya tiene las propiedades directas
  // (name, primary, notNull, dataType, etc.)
  if (!columnConfig || typeof columnConfig !== 'object') {
    throw new Error(`Campo "${fieldName}" no tiene configuración válida`);
  }

  return {
    name: fieldName,
    type: extractDataType(columnConfig),
    isRequired: columnConfig.notNull === true,
    isUnique: columnConfig.isUnique === true,
    isPrimaryKey: columnConfig.primary === true,
    hasDefault: columnConfig.hasDefault === true,
    foreignKey: extractForeignKeyInfo(columnConfig)
  };
}

/**
 * Extrae el tipo de dato de la columna Drizzle
 * 
 * @param columnConfig - Configuración de columna de Drizzle
 * @returns Tipo de dato normalizado
 */
function extractDataType(columnConfig: any): string {
  const dataType = columnConfig.dataType || '';

  if (dataType === 'number' || dataType.includes('serial') || dataType.includes('int')) return 'number';
  if (dataType === 'string' || dataType.includes('varchar') || dataType.includes('text')) return 'string';
  if (dataType === 'boolean' || dataType.includes('bool')) return 'boolean';
  if (dataType === 'date' || dataType.includes('timestamp')) return 'date';
  if (dataType.includes('decimal') || dataType.includes('numeric')) return 'decimal';
  if (dataType.includes('uuid')) return 'uuid';
  if (dataType.includes('json')) return 'json';

  console.warn(`⚠️ Tipo de dato desconocido: ${dataType}`);
  return 'unknown';
}

/**
 * Extrae información de clave foránea si existe
 * 
 * @param columnConfig - Configuración de columna de Drizzle
 * @returns Información de FK o undefined
 */
function extractForeignKeyInfo(columnConfig: any): TableFieldInfo['foreignKey'] {
  // En Drizzle, la información de FK está en la tabla y es compleja de extraer
  // Por ahora retornamos undefined - se puede mejorar en el futuro
  // TODO: Implementar extracción de FK desde columnConfig.table si es necesario
  return undefined;
}

/**
 * Extrae el schema completo de una tabla Drizzle
 * 
 * @param tableObj - Objeto tabla de Drizzle (ej: usersTable)
 * @param tableName - Nombre de la tabla
 * @returns Schema con todos los campos
 * 
 * @example
 * const userSchema = extractTableSchema(usersTable, 'users');
 * // Retorna:
 * // {
 * //   tableName: 'users',
 * //   fields: [
 * //     { name: 'id', type: 'number', isPrimaryKey: true, ... },
 * //     { name: 'email', type: 'string', isUnique: true, ... },
 * //     ...
 * //   ],
 * //   primaryKeys: ['id']
 * // }
 */
export function extractTableSchema(tableObj: any, tableName: string): TableSchema {
  if (!tableObj) {
    throw new Error(`Tabla no definida: ${tableName}`);
  }

  // Usar getTableColumns de Drizzle para extraer todas las columnas
  const columns = getTableColumns(tableObj);

  if (!columns || Object.keys(columns).length === 0) {
    throw new Error(`No se encontraron columnas para la tabla: ${tableName}`);
  }

  // Procesar cada columna
  const fields: TableFieldInfo[] = Object.entries(columns)
    .map(([fieldName, columnConfig]) => extractFieldInfo(fieldName, columnConfig));

  // Identificar claves primarias
  const primaryKeys = fields
    .filter(f => f.isPrimaryKey)
    .map(f => f.name);

  return {
    tableName,
    fields,
    primaryKeys: primaryKeys.length > 0 ? primaryKeys : undefined
  };
}

/**
 * Valida que un schema extraído sea válido
 * 
 * @param schema - Schema a validar
 * @throws Error si el schema no es válido
 */
export function validateTableSchema(schema: TableSchema): void {
  if (!schema.tableName) {
    throw new Error('Schema debe tener tableName');
  }

  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    throw new Error(`Schema de ${schema.tableName} debe tener al menos un campo`);
  }

  // Validar que cada campo tenga las propiedades requeridas
  schema.fields.forEach(field => {
    if (!field.name || !field.type) {
      throw new Error(`Campo inválido en schema: ${JSON.stringify(field)}`);
    }
  });

  console.log(`✅ Schema válido para tabla "${schema.tableName}" con ${schema.fields.length} campos`);
}
