/* src/services/devTools/devTools.types.ts */

// #interface DevToolsResponse - Respuesta estándar de todas las operaciones del servicio DevTools
/**
 * @description
 * Respuesta estándar de todas las operaciones del servicio DevTools.
 *
 * @purpose
 * Proveer un contrato consistente para que los controladores sepan qué esperar de cualquier operación del servicio.
 *
 * @context
 * Retornado por todas las funciones del servicio DevTools y consumido por los controladores correspondientes.
 *
 * @template T Tipo de los datos retornados en caso de éxito
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface DevToolsResponse<T = unknown> {
  // #v-field success - Indica si la operación fue exitosa
  /** indica si la operación fue exitosa */
  success: boolean;
  // #end-v-field
  // #v-field data - Datos retornados de la operación
  /** datos retornados si la operación fue exitosa */
  data?: T;
  // #end-v-field
  // #v-field error - Mensaje de error
  /** mensaje de error si la operación falló */
  error?: string;
  // #end-v-field
  // #v-field metadata - Información adicional de la operación
  /** información adicional útil para debugging */
  metadata?: {
    /** cantidad de registros afectados */
    recordsAffected?: number;
    /** timestamp de la operación */
    timestamp?: Date;
    /** query ejecutada (solo en desarrollo) */
    executedQuery?: string;
  };
  // #end-v-field
}
// #end-interface

// #type FilterConditions - Condiciones de filtro para búsquedas
/**
 * @description
 * Condiciones de filtro para búsquedas dentro del servicio DevTools.
 *
 * @purpose
 * Permitir filtros simples de igualdad en las operaciones de lectura y eliminación de registros.
 *
 * @context
 * Utilizado por las operaciones de lectura y búsqueda del servicio DevTools.
 *
 * @example
 * ```ts
 * const filters: FilterConditions = { type: 'admin', state: 'active' };
 * ```
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type FilterConditions = Record<string, unknown>;
// #end-type

// #interface DataGeneratorOptions - Opciones para generar datos aleatorios en batch creation
/**
 * @description
 * Opciones para generar datos aleatorios en operaciones de creación batch.
 *
 * @purpose
 * Definir cómo se generan registros de prueba al ejecutar operaciones de creación masiva en DevTools.
 *
 * @context
 * Utilizado por las funciones de creación batch del servicio DevTools.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface DataGeneratorOptions {
  // #f-field customGenerator - Generador personalizado de datos
  /** función personalizada para generar datos aleatorios por índice */
  customGenerator?: (index: number) => Record<string, unknown>;
  // #end-f-field
  // #v-field useRandomData - Usa valores aleatorios
  /** si false, usa valores por defecto para cada tipo de campo */
  useRandomData?: boolean;
  // #end-v-field
}
// #end-interface

// #interface CRUDOperation - Configuración de una operación CRUD
/**
 * @description
 * Configuración de una operación CRUD del servicio DevTools.
 *
 * @purpose
 * Encapsular los parámetros comunes para todas las operaciones CRUD en una estructura reutilizable.
 *
 * @context
 * Utilizado por las funciones del servicio DevTools para ejecutar operaciones sobre la base de datos.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface CRUDOperation {
  // #v-field tableName - Nombre de la tabla objetivo
  /** nombre de la tabla sobre la que se ejecuta la operación (ej: 'users', 'apiPlatforms') */
  tableName: string;
  // #end-v-field
  // #v-field data - Datos de la operación
  /** datos a procesar en operaciones de creación o actualización */
  data?: Record<string, unknown>;
  // #end-v-field
  // #v-field filters - Condiciones de filtro
  /** filtros a aplicar en operaciones de lectura, eliminación o actualización */
  filters?: FilterConditions;
  // #end-v-field
  // #v-field id - Identificador único del registro
  /** identificador único del registro para operaciones sobre un solo elemento */
  id?: number | string;
  // #end-v-field
}
// #end-interface

// #interface TableFieldInfo - Información de un campo de una tabla extraída del schema de Drizzle
/**
 * @description
 * Información detallada de un campo dentro de una tabla, extraída del schema de Drizzle.
 *
 * @purpose
 * Describir la estructura de un campo de tabla para habilitar operaciones CRUD dinámicas sin conocer el schema en tiempo de compilación.
 *
 * @context
 * Utilizado por el servicio DevTools para introspeccionar el schema y generar operaciones CRUD automáticas.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface TableFieldInfo {
  // #v-field name - Nombre del campo
  /** nombre del campo en la tabla */
  name: string;
  // #end-v-field
  // #v-field type - Tipo de dato del campo
  /** tipo de dato del campo (string, number, boolean, date, etc.) */
  type: string;
  // #end-v-field
  // #v-field isRequired - Indica si el campo es obligatorio
  /** indica si el campo es obligatorio */
  isRequired: boolean;
  // #end-v-field
  // #v-field isUnique - Indica si el campo es único
  /** indica si el campo tiene restricción de unicidad */
  isUnique: boolean;
  // #end-v-field
  // #v-field isPrimaryKey - Indica si es clave primaria
  /** indica si el campo es clave primaria */
  isPrimaryKey: boolean;
  // #end-v-field
  // #v-field hasDefault - Indica si tiene valor por defecto
  /** indica si el campo tiene un valor por defecto definido */
  hasDefault: boolean;
  // #end-v-field
  // #v-field foreignKey - Información de clave foránea
  /** información de la clave foránea si el campo referencia otra tabla */
  foreignKey?: {
    /** tabla a la que apunta la clave foránea */
    referencesTable: string;
    /** campo al que apunta la clave foránea */
    referencesField: string;
  };
  // #end-v-field
}
// #end-interface

// #interface TableSchema - Esquema completo de una tabla con info para operaciones CRUD
/**
 * @description
 * Esquema completo de una tabla con toda la información para realizar operaciones CRUD.
 *
 * @purpose
 * Centralizar la descripción estructural de una tabla para habilitar introspección y operaciones dinámicas.
 *
 * @context
 * Utilizado por el servicio DevTools para construir y ejecutar operaciones CRUD sobre cualquier tabla.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface TableSchema {
  // #v-field tableName - Nombre de la tabla
  /** nombre de la tabla */
  tableName: string;
  // #end-v-field
  // #v-field description - Descripción de la tabla
  /** descripción de la tabla extraída de comentarios si existe */
  description?: string;
  // #end-v-field
  // #v-field fields - Campos de la tabla
  /** listado de campos con su información detallada */
  fields: TableFieldInfo[];
  // #end-v-field
  // #v-field primaryKeys - Claves primarias de la tabla
  /** campos que actúan como claves primarias */
  primaryKeys?: string[];
  // #end-v-field
}
// #end-interface

// #enum CRUDOperationType - Tipos de operaciones CRUD soportadas
/**
 * @description
 * Enumeración de los tipos de operaciones CRUD soportadas por el servicio DevTools.
 *
 * @purpose
 * Tipar explícitamente las operaciones disponibles para evitar errores por cadenas arbitrarias.
 *
 * @context
 * Utilizado por el servicio DevTools y los controladores al identificar el tipo de operación a ejecutar.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
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
// #end-enum