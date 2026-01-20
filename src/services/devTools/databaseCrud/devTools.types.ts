/* src/services/devTools/devTools.types.ts */

// #section Tipos Base para DevTools

/**
 * Respuesta estándar de todas las operaciones del servicio DevTools.
 * Proporciona un contrato consistente para que los controladores sepan qué esperar.
 */
export interface DevToolsResponse<T = any> {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Datos retornados (si la operación fue exitosa) */
  data?: T;
  /** Mensaje de error (si la operación falló) */
  error?: string;
  /** Información adicional útil para debugging */
  metadata?: {
    /** Cantidad de registros afectados */
    recordsAffected?: number;
    /** Timestamp de la operación */
    timestamp?: Date;
    /** Query ejecutada (solo en desarrollo) */
    executedQuery?: string;
  };
}

/**
 * Condiciones de filtro para búsquedas.
 * Soporta filtros simples de igualdad para la Fase 1.
 * 
 * Ejemplo:
 * {
 *   type: 'admin',
 *   isActive: true,
 *   state: 'active'
 * }
 */
export type FilterConditions = Record<string, any>;

/**
 * Opciones para generar datos aleatorios en batch creation.
 * Define cómo se generan registros de prueba.
 */
export interface DataGeneratorOptions {
  /** Función personalizada para generar datos aleatorios */
  customGenerator?: (index: number) => Record<string, any>;
  /** Si false, usa valores por defecto para cada tipo de campo */
  useRandomData?: boolean;
}

/**
 * Configuración de una operación CRUD.
 * Encapsula los parámetros comunes para todas las operaciones.
 */
export interface CRUDOperation {
  /** Nombre de la tabla (ej: 'users', 'apiPlatforms') */
  tableName: string;
  /** Datos a procesar (para create/update) */
  data?: Record<string, any>;
  /** Filtros a aplicar (para read/delete/update) */
  filters?: FilterConditions;
  /** Identificador único (para operaciones de un solo registro) */
  id?: number | string;
}

// #end-section

// #section Interfaces para Descubrimiento de Schema

/**
 * Información de un campo dentro de una tabla.
 * Se extrae automáticamente del schema de Drizzle.
 */
export interface TableFieldInfo {
  /** Nombre del campo */
  name: string;
  /** Tipo de dato (string, number, boolean, date, etc.) */
  type: string;
  /** Si el campo es obligatorio */
  isRequired: boolean;
  /** Si el campo es única */
  isUnique: boolean;
  /** Si es clave primaria */
  isPrimaryKey: boolean;
  /** Si tiene valor por defecto */
  hasDefault: boolean;
  /** Información de FK si aplica */
  foreignKey?: {
    /** Tabla a la que apunta */
    referencesTable: string;
    /** Campo al que apunta */
    referencesField: string;
  };
}

/**
 * Esquema completo de una tabla.
 * Contiene toda la información necesaria para realizar operaciones CRUD.
 */
export interface TableSchema {
  /** Nombre de la tabla */
  tableName: string;
  /** Descripción de la tabla (extraída de comentarios si existe) */
  description?: string;
  /** Listado de campos con su información */
  fields: TableFieldInfo[];
  /** Campos que son clave primaria */
  primaryKeys?: string[];
}

// #end-section

// #section Enums para Operaciones

/**
 * Tipos de operaciones CRUD soportadas.
 */
export enum CRUDOperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  READ_ONE = 'READ_ONE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE_BATCH = 'CREATE_BATCH',
  SEARCH = 'SEARCH'
}

// #end-section
