/**
 * Manejadores de errores específicos de PostgreSQL para servicios de Company
 */

import { DatabaseError } from 'pg';

/**
 * Maneja errores de BD y los convierte en mensajes amigables
 */
export function handleDatabaseError(error: unknown, context?: string): never {
  // Drizzle envuelve errores de PostgreSQL en error.cause
  const dbError = (error as any)?.cause || error;
  
  // Manejar errores con código de PostgreSQL
  const errorCode = (dbError as any)?.code;
  const errorMessage = (dbError as any)?.message || '';
  const errorDetail = (dbError as any)?.detail || '';
  const errorConstraint = (dbError as any)?.constraint || '';
  
  // Violación de constraint único (23505)
  if (errorCode === '23505' || 
      errorConstraint === 'companies_name_unique' ||
      errorMessage.includes('duplicate key') || 
      errorMessage.includes('companies_name_unique') ||
      errorDetail.includes('already exists')) {
    throw new Error('Nombre no disponible');
  }
  
  if (dbError instanceof DatabaseError) {
    // Violación de foreign key
    if (dbError.code === '23503') {
      throw new Error('Invalid reference - related entity does not exist');
    }

    // Query cancelada por timeout
    if (dbError.code === '57014') {
      throw new Error('Operation timeout - please try again');
    }

    // Deadlock detectado
    if (dbError.code === '40P01') {
      throw new Error('Concurrent operation conflict - please retry');
    }

    // Error genérico de BD con contexto
    const message = context 
      ? `Database error during ${context}: ${dbError.message}`
      : `Database error: ${dbError.message}`;
    throw new Error(message);
  }

  // Si no es un error de BD, re-lanzarlo
  throw error;
}
