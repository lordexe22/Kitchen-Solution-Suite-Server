/* src/services/devTools/index.ts */

// #section Export Schema Discovery
export {
  getAvailableTables,
  tableExists,
  getTableSchema,
  getTableMetadata
} from './schema-discovery.service';

export type { TableSchema, TableFieldInfo } from './devTools.types';
// #end-section

// #section Export Create Service
export {
  createRecord,
  createRecordBatch
} from './create.service';
// #end-section

// #section Export Read Service
export {
  readRecords,
  readRecordById
} from './read.service';
// #end-section

// #section Export Update Service
export {
  updateRecord,
  updateRecordBatch
} from './update.service';
// #end-section

// #section Export Delete Service
export {
  deleteRecord,
  deleteRecordBatch
} from './delete.service';
// #end-section

// #section Export Data Generator
export {
  generateRandomData,
  validateGeneratedData
} from './data-generator.service';

export type { DataGeneratorOptions } from './devTools.types';
// #end-section

// #section Export Types
export type {
  DevToolsResponse,
  FilterConditions,
  CRUDOperation
} from './devTools.types';

export { CRUDOperationType } from './devTools.types';
// #end-section

// #info
/**
 * DevTools CRUD Service - Punto de entrada centralizado
 * 
 * Este módulo agrupa todos los servicios relacionados a operaciones CRUD
 * agnósticas sobre las tablas de base de datos para propósitos de desarrollo.
 * 
 * Estructura:
 * - schema-discovery.service: Inspecciona y valida tablas
 * - create.service: Operaciones CREATE (insertar registros)
 * - read.service: Operaciones READ (obtener registros)
 * - update.service: Operaciones UPDATE (modificar registros)
 * - delete.service: Operaciones DELETE (eliminar registros)
 * - data-generator.service: Genera datos aleatorios para testing
 * 
 * Uso:
 * import { createRecord, readRecords, updateRecord, deleteRecord } from '@/services/devTools';
 * 
 * const newUser = await createRecord('users', { firstName: 'Juan', ... });
 * const users = await readRecords('users', { type: 'admin' });
 * await updateRecord('users', 5, { isActive: true });
 * await deleteRecord('users', 5);
 */
// #end-info
