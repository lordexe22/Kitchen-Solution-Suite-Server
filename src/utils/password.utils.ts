// src/utils/password.utils.ts
// #section Imports
import bcrypt from 'bcrypt';
// #end-section
// #function hashPassword - Genera un hash seguro para una contraseña.
/**
 * @description Genera un hash bcrypt seguro a partir de una contraseña en texto plano.
 * @purpose Encapsular la lógica de hashing para garantizar que las contraseñas nunca se almacenen en texto claro.
 * @context Utilizado por los servicios de autenticación al registrar o actualizar la contraseña de un usuario.
 * @param password contraseña en texto plano a hashear
 * @returns hash seguro generado por bcrypt
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
// #end-function
// #function comparePassword - Compara una contraseña con su hash.
/**
 * @description Compara una contraseña en texto plano contra su hash bcrypt almacenado.
 * @purpose Validar credenciales de usuario sin exponer ni almacenar la contraseña original.
 * @context Utilizado por el servicio de autenticación durante el proceso de login local.
 * @param password contraseña en texto plano proporcionada por el usuario
 * @param hash hash almacenado en la base de datos correspondiente al usuario
 * @returns true si la contraseña coincide con el hash, false en caso contrario
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
// #end-function
