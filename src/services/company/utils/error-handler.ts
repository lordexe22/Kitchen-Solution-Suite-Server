/**
 * Manejadores de errores específicos de PostgreSQL para servicios de Company
 */

import { DatabaseError } from 'pg';

/**
 * Maneja errores de BD y los convierte en mensajes amigables
 */
export function handleDatabaseError(error: unknown, context?: string): never {
  if (error instanceof DatabaseError) {
    // Violación de constraint único
    if (error.code === '23505') {
      if (error.constraint === 'companies_name_unique') {
        throw new Error('Company name is already taken');
      }
      throw new Error('Duplicate entry detected');
    }

    // Violación de foreign key
    if (error.code === '23503') {
      throw new Error('Invalid reference - related entity does not exist');
    }

    // Query cancelada por timeout
    if (error.code === '57014') {
      throw new Error('Operation timeout - please try again');
    }

    // Deadlock detectado
    if (error.code === '40P01') {
      throw new Error('Concurrent operation conflict - please retry');
    }

    // Error genérico de BD con contexto
    const message = context 
      ? `Database error during ${context}: ${error.message}`
      : `Database error: ${error.message}`;
    throw new Error(message);
  }

  // Si no es un error de BD, re-lanzarlo
  throw error;
}
