// src/utils/password.utils.ts
// #section Imports
import bcrypt from 'bcrypt';
// #end-section

// #function hashPassword - Genera un hash seguro para una contraseña.
/**
 * Genera un hash seguro para una contraseña.
 * @param password - Contraseña en texto plano.
 * @returns Hash de la contraseña.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
// #end-function

// #function comparePassword - Compara una contraseña con su hash.
/**
 * Compara una contraseña con su hash.
 * @param password - Contraseña en texto plano.
 * @param hash - Hash almacenado.
 * @returns true si coinciden, false en caso contrario.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
// #end-function
