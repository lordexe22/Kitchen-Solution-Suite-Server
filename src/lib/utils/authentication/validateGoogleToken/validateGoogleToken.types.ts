/* #info - Tipos e interfaces para la validación del token de Google */

// #interface GooglePayload - Payload normalizado del token de ID de Google
/**
 * @description
 * Payload normalizado extraído de un token de ID de Google.
 *
 * @purpose
 * Centralizar los datos del token de Google en una estructura tipada para su uso tras la validación.
 *
 * @context
 * Retornado por la utilidad validateGoogleToken luego de verificar el token con la API de Google.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface GooglePayload {
  // #v-field sub - Identificador único del usuario en Google
  /** identificador único del usuario en Google */
  sub: string;
  // #end-v-field
  // #v-field email - Correo electrónico del usuario
  /** correo electrónico del usuario */
  email: string;
  // #end-v-field
  // #v-field email_verified - Verificación del correo
  /** indica si el correo fue verificado por Google */
  email_verified: boolean;
  // #end-v-field
  // #v-field name - Nombre completo del usuario
  /** nombre completo del usuario */
  name: string;
  // #end-v-field
  // #v-field picture - URL de la foto de perfil
  /** URL de la foto de perfil del usuario */
  picture: string;
  // #end-v-field
  // #v-field given_name - Nombre de pila del usuario
  /** nombre de pila del usuario */
  given_name?: string;
  // #end-v-field
  // #v-field family_name - Apellido del usuario
  /** apellido del usuario */
  family_name?: string;
  // #end-v-field
  // #v-field iat - Issued at timestamp
  /** timestamp de emisión del token */
  iat: number;
  // #end-v-field
  // #v-field exp - Expiration timestamp
  /** timestamp de expiración del token */
  exp: number;
  // #end-v-field
  // #v-field iss - Emisor del token
  /** emisor del token */
  iss: string;
  // #end-v-field
  // #v-field aud - Audiencia del token
  /** audiencia del token (client ID de la aplicación) */
  aud: string;
  // #end-v-field
}
// #end-interface

// #interface ValidateGoogleTokenOptions - Opciones para la validación del token de Google
/**
 * @description
 * Opciones configurables para el proceso de validación del token de ID de Google.
 *
 * @purpose
 * Permitir sobrescribir el client ID y el emisor esperado para contextos de testing o múltiples entornos.
 *
 * @context
 * Utilizado como parámetro de configuración en la función validateGoogleToken.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface ValidateGoogleTokenOptions {
  // #v-field clientId - Client ID de Google a validar
  /** client ID de Google a validar; por defecto usa la variable de entorno GOOGLE_CLIENT_ID */
  clientId?: string;
  // #end-v-field
  // #v-field expectedIssuer - Emisor esperado del token
  /** emisor esperado; por defecto https://accounts.google.com */
  expectedIssuer?: string;
  // #end-v-field
}
// #end-interface
