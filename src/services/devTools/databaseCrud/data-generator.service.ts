/* src/services/devTools/data-generator.service.ts */

// #section Imports
import { getTableSchema } from './schema-discovery.service';
import type { DataGeneratorOptions } from './devTools.types';
// #end-section

// #info
/**
 * Servicio de generación de datos aleatorios para DevTools.
 * 
 * Responsabilidades:
 * - Generar datos plausibles para tablas específicas
 * - Respetar tipos de datos y constraints
 * - Permitir generadores personalizados
 * 
 * Independencia:
 * - Agnóstico respecto a lógica de negocio
 * - Solo genera valores de tipos simples
 */
// #end-info

// #function generateRandomData
/**
 * Genera un conjunto de datos aleatorios para una tabla.
 * 
 * Genera valores por defecto para cada tipo de dato.
 * No genera datos para campos PK (se auto-generan).
 * 
 * @param tableName - Nombre de la tabla
 * @param count - Cantidad de registros a generar
 * @param options - Opciones de generación (custom generator, etc.)
 * @returns Array de objetos con datos aleatorios
 * 
 * @example
 * const testUsers = await generateRandomData('users', 5);
 * // Genera 5 usuarios con datos plausibles
 */
export function generateRandomData(
  tableName: string,
  count: number = 1,
  options?: DataGeneratorOptions
): Record<string, any>[] {
  // #step 1 - Obtener schema de la tabla
  const tableSchema = getTableSchema(tableName);
  // #end-step

  // #step 2 - Generar array de registros
  const records: Record<string, any>[] = [];

  for (let i = 0; i < count; i++) {
    // Si existe custom generator, usarlo
    if (options?.customGenerator) {
      records.push(options.customGenerator(i));
      continue;
    }

    // Generar datos por defecto
    const record: Record<string, any> = {};

    for (const field of tableSchema.fields) {
      // Saltar campos auto-generados (PK, timestamps con default)
      if (field.isPrimaryKey || (field.hasDefault && field.name !== 'createdAt')) {
        continue;
      }

      // Generar valor por tipo
      record[field.name] = generateValueByType(field.type, field.name, i);
    }

    records.push(record);
  }
  // #end-step

  return records;
}
// #end-function

// #function generateValueByType
/**
 * Genera un valor aleatorio basado en el tipo de dato.
 * 
 * @param type - Tipo de dato (string, number, boolean, date, etc.)
 * @param fieldName - Nombre del campo (para generar valores contextuales)
 * @param index - Índice del registro (para unicidad)
 * @returns Valor aleatorio del tipo especificado
 */
function generateValueByType(type: string, fieldName: string, index: number): any {
  switch (type) {
    case 'string':
      return generateRandomString(fieldName, index);

    case 'number':
      return generateRandomNumber();

    case 'boolean':
      return Math.random() > 0.5;

    case 'date':
      return new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Fecha aleatoria en el último año

    case 'decimal':
      return parseFloat((Math.random() * 100).toFixed(2));

    case 'uuid':
      return generateUUID();

    default:
      return null;
  }
}
// #end-function

// #function generateRandomString
/**
 * Genera un string aleatorio contextual al nombre del campo.
 * 
 * @param fieldName - Nombre del campo
 * @param index - Índice para unicidad
 * @returns String aleatorio
 */
function generateRandomString(fieldName: string, index: number): string {
  const firstName = [
    'Juan', 'María', 'Carlos', 'Ana', 'Pedro',
    'Laura', 'Miguel', 'Sofia', 'Luis', 'Elena'
  ];

  const lastName = [
    'García', 'Rodríguez', 'Martínez', 'López', 'Pérez',
    'González', 'Sanchez', 'Morales', 'Herrera', 'Medina'
  ];

  // Detectar contexto por nombre de campo
  if (fieldName.includes('firstName') || fieldName.includes('first_name')) {
    return firstName[Math.floor(Math.random() * firstName.length)];
  }

  if (fieldName.includes('lastName') || fieldName.includes('last_name')) {
    return lastName[Math.floor(Math.random() * lastName.length)];
  }

  if (fieldName.includes('email')) {
    const user = firstName[index % firstName.length].toLowerCase();
    return `${user}${index}@example.com`;
  }

  if (fieldName.includes('password')) {
    return `Password${Math.random().toString(36).substring(2, 10)}`;
  }

  if (fieldName.includes('hash')) {
    return `hash_${Math.random().toString(36).substring(2, 15)}`;
  }

  if (fieldName.includes('url') || fieldName.includes('imageUrl')) {
    return `https://example.com/resource${index}.jpg`;
  }

  if (fieldName.includes('token')) {
    return `token_${Math.random().toString(36).substring(2, 15)}`;
  }

  // String genérico
  return `value_${index}_${Math.random().toString(36).substring(2, 8)}`;
}
// #end-function

// #function generateRandomNumber
/**
 * Genera un número aleatorio entre 1 y 1000.
 * 
 * @returns Número aleatorio
 */
function generateRandomNumber(): number {
  return Math.floor(Math.random() * 1000) + 1;
}
// #end-function

// #function generateUUID
/**
 * Genera un UUID v4 aleatorio.
 * 
 * @returns UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
// #end-function

// #function validateGeneratedData
/**
 * Valida que los datos generados cumplan con requisitos básicos.
 * 
 * Utilidad para testing del generador.
 * 
 * @param tableName - Nombre de la tabla
 * @param data - Datos generados a validar
 * @returns true si son válidos, false en caso contrario
 */
export function validateGeneratedData(tableName: string, data: Record<string, any>): boolean {
  const schema = getTableSchema(tableName);

  for (const field of schema.fields) {
    const value = data[field.name];

    // Campos no generados deben ser undefined
    if (field.isPrimaryKey || field.hasDefault) {
      continue;
    }

    // Campos requeridos no deben ser null
    if (field.isRequired && value === null) {
      return false;
    }

    // Validar tipo (simplista)
    if (value !== null && value !== undefined) {
      const valueType = typeof value;

      if (field.type === 'number' && valueType !== 'number') {
        return false;
      }

      if (field.type === 'string' && valueType !== 'string') {
        return false;
      }

      if (field.type === 'boolean' && valueType !== 'boolean') {
        return false;
      }
    }
  }

  return true;
}
// #end-function
