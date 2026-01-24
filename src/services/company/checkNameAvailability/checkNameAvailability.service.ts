// src/services/company/checkNameAvailability/checkNameAvailability.service.ts

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { normalizeCompanyName } from '../constants';

/**
 * Verifica si un nombre de compañía está disponible para ser usado.
 * 
 * ⚠️ IMPORTANTE: Este check es solo un UX HINT, NO una garantía de unicidad.
 * La única fuente de verdad es el UNIQUE constraint en la base de datos.
 * 
 * Uso recomendado:
 * - Mostrar feedback inmediato al usuario mientras escribe
 * - NO usar como validación pre-creación/actualización
 * - Siempre manejar error 23505 (unique violation) en create/update
 * 
 * Compañías archivadas se consideran ocupadas (el nombre sigue siendo suyo).
 * 
 * @param name - Nombre a verificar
 * @returns boolean - true si el nombre está disponible, false si ya está en uso
 * @throws Error - Si algo falla en la búsqueda en BD
 * 
 * @example
 * // ✅ Uso correcto: UX hint
 * const available = await checkNameAvailability('Mi Empresa');
 * setInputHint(available ? 'Available' : 'Taken');
 * 
 * // ❌ Uso incorrecto: No confiar como validación
 * if (await checkNameAvailability(name)) {
 *   await createCompany(name); // ⚠️ Puede fallar por race condition
 * }
 */
export async function checkNameAvailability(name: string): Promise<boolean> {
  try {
    // Validar que el nombre no esté vacío
    if (!name || typeof name !== 'string') {
      throw new Error('El nombre debe ser un texto válido');
    }

    const normalizedName = normalizeCompanyName(name);

    if (normalizedName.length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }

    // Consultar la BD: ¿existe alguna compañía con este nombre normalizado?
    // El nombre ya está normalizado al guardarse, así que buscamos directamente
    const existingCompanies = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.name, normalizedName))
      .limit(1);

    // Si no hay resultados, el nombre está disponible
    return existingCompanies.length === 0;
  } catch (error) {
    console.error('Error checking company name availability:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Error al verificar disponibilidad del nombre'
    );
  }
}
