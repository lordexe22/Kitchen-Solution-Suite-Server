/* src/services/devTools/schema-discovery.service.ts */

// DEPRECADO: Usar table-schema.service.ts en su lugar

// #section Imports
import * as schema from '../../../db/schema';
import type { TableSchema } from './devTools.types';
// #end-section

// #constant Mapeo de Tablas
const TABLE_REGISTRY: Record<string, any> = {
  users: schema.usersTable,
  apiPlatforms: schema.apiPlatformsTable,
  companies: schema.companiesTable,
};
// #end-constant

export function getAvailableTables(): string[] {
  return Object.keys(TABLE_REGISTRY);
}

export function tableExists(tableName: string): boolean {
  return tableName in TABLE_REGISTRY;
}

/**
 * DEPRECADO: Usa extractTableSchema de table-schema.service.ts
 */
export function getTableSchema(tableName: string): TableSchema {
  throw new Error('getTableSchema está deprecado. Usa extractTableSchema de table-schema.service.ts');
}

export function getTableMetadata(tableName: string) {
  if (!tableExists(tableName)) {
    throw new Error(`Tabla no encontrada: ${tableName}`);
  }

  return {
    tableName,
    available: true
  };
}
