/* src/services/devTools/schema-discovery.service.ts */

// #section Imports
import * as schema from '../../../db/schema';
import type { TableSchema, TableFieldInfo } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de descubrimiento de schema.
 * 
 * Responsabilidades:
 * - Inspeccionar el schema de Drizzle en tiempo de ejecución
 * - Descubrir qué tablas existen en la base de datos
 * - Extraer información de campos (tipos, constraints, etc.)
 * - Validar que una tabla exista antes de operaciones CRUD
 * 
 * Independencia: Agnóstico respecto a la lógica de negocio.
 * Solo lee metadatos del ORM.
 */
// #end-info

// #constant Mapeo de Tablas
/**
 * Mapeo de nombres de tabla a sus objetos Drizzle.
 * Se actualiza manualmente cuando se agregan nuevas tablas.
 * 
 * CONVENCION: El nombre de variable en schema.ts debe ser:
 * `{tableName}Table` (ej: usersTable, apiPlatformsTable)
 */
const TABLE_REGISTRY: Record<string, any> = {
  users: schema.usersTable,
  apiPlatforms: schema.apiPlatformsTable,
  // Se agregan más tablas aquí conforme se creen
};

// #end-constant

// #function getAvailableTables
/**
 * Retorna la lista de todas las tablas disponibles en DevTools.
 * 
 * @returns Array con nombres de tablas disponibles
 */
export function getAvailableTables(): string[] {
  return Object.keys(TABLE_REGISTRY);
}
// #end-function

// #function tableExists
/**
 * Verifica si una tabla existe en el schema.
 * 
 * @param tableName - Nombre de la tabla a verificar
 * @returns true si la tabla existe, false en caso contrario
 */
export function tableExists(tableName: string): boolean {
  return tableName in TABLE_REGISTRY;
}
// #end-function

// #function getTableSchema
/**
 * Extrae el schema completo de una tabla del ORM Drizzle.
 * 
 * Analiza la estructura de la tabla y retorna:
 * - Listado de campos con tipos
 * - Información de constraints (required, unique, FK)
 * - Claves primarias
 * 
 * @param tableName - Nombre de la tabla
 * @returns Schema de la tabla
 * @throws Error si la tabla no existe
 * 
 * @example
 * const userSchema = getTableSchema('users');
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
export function getTableSchema(tableName: string): TableSchema {
  if (!tableExists(tableName)) {
    throw new Error(`Tabla no encontrada: ${tableName}. Tablas disponibles: ${getAvailableTables().join(', ')}`);
  }

  const tableObj = TABLE_REGISTRY[tableName];
  const columns = tableObj._.columns;

  // Extraer información de campos
  const fields: TableFieldInfo[] = Object.entries(columns).map(([fieldName, columnConfig]: [string, any]) => {
    return {
      name: fieldName,
      type: inferType(columnConfig),
      isRequired: !columnConfig._.notNull === false, // Drizzle marca notNull
      isUnique: columnConfig._.isUnique || false,
      isPrimaryKey: columnConfig._.isPrimaryKey || false,
      hasDefault: columnConfig._.default !== undefined,
      foreignKey: extractForeignKey(columnConfig)
    };
  });

  // Identificar claves primarias
  const primaryKeys = fields
    .filter(f => f.isPrimaryKey)
    .map(f => f.name);

  return {
    tableName,
    fields,
    primaryKeys: primaryKeys.length > 0 ? primaryKeys : ['id'] // Asumir 'id' si no hay PK
  };
}
// #end-function

// #function inferType
/**
 * Infiere el tipo de dato de un campo Drizzle.
 * 
 * @param columnConfig - Configuración del campo de Drizzle
 * @returns String con el tipo inferido
 */
function inferType(columnConfig: any): string {
  // Obtener el tipo interno de Drizzle
  const typeStr = columnConfig._.columnType || '';

  // Mapear tipos Drizzle a tipos simples
  if (typeStr.includes('serial') || typeStr.includes('integer')) return 'number';
  if (typeStr.includes('varchar') || typeStr.includes('text')) return 'string';
  if (typeStr.includes('boolean')) return 'boolean';
  if (typeStr.includes('timestamp')) return 'date';
  if (typeStr.includes('decimal')) return 'decimal';
  if (typeStr.includes('uuid')) return 'uuid';

  return 'unknown';
}
// #end-function

// #function extractForeignKey
/**
 * Extrae información de clave foránea si existe.
 * 
 * @param columnConfig - Configuración del campo
 * @returns Información de FK o undefined si no es FK
 */
function extractForeignKey(columnConfig: any): { referencesTable: string; referencesField: string } | undefined {
  const references = columnConfig._.references;

  if (!references) return undefined;

  // Drizzle almacena referencias en forma { foreignKeyColumn: () => sourceTable.field }
  // Por ahora retornamos la información básica
  // En implementaciones futuras se puede mejorar el parsing
  return {
    referencesTable: 'unknown', // Requeriría parsing más complejo
    referencesField: 'unknown'
  };
}
// #end-function

// #function getTableMetadata
/**
 * Retorna metadatos útiles sobre una tabla.
 * Información rápida sin análisis profundo.
 * 
 * @param tableName - Nombre de la tabla
 * @returns Objeto con metadatos
 */
export function getTableMetadata(tableName: string) {
  const schema = getTableSchema(tableName);

  return {
    tableName,
    fieldCount: schema.fields.length,
    fieldNames: schema.fields.map(f => f.name),
    primaryKeys: schema.primaryKeys,
    requiredFields: schema.fields.filter(f => f.isRequired).map(f => f.name),
    uniqueFields: schema.fields.filter(f => f.isUnique).map(f => f.name)
  };
}
// #end-function
