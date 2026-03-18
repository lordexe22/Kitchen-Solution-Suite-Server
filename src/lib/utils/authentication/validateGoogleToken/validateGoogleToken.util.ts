/* #info - Google ID token validation utilities */
// #section Imports
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_TOKEN_ISSUER, GOOGLE_TOKEN_ERROR_CODES } from "./validateGoogleToken.constants";
import type { GooglePayload, ValidateGoogleTokenOptions } from "./validateGoogleToken.types";
import { GoogleTokenError } from "./validateGoogleToken.errors";
import { validateGoogleTokenConfig } from "./validateGoogleToken.config";
// #end-section
// #section Client cache (one OAuth2Client per clientId)
const clients = new Map<string, OAuth2Client>();
// #function getClient - Returns (and caches) an OAuth2Client instance
/**
 * @description Retorna una instancia de OAuth2Client cacheada para el clientId dado, creándola si no existe.
 * @purpose Reutilizar instancias de OAuth2Client evitando crearlas repetidamente por cada validación.
 * @context Utilizado por validateGoogleToken internamente para obtener el cliente de Google Auth.
 * @param clientId Google OAuth client ID al que se vinculará el cliente OAuth2
 * @returns instancia de OAuth2Client vinculada al clientId
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function getClient(clientId: string): OAuth2Client {
  const cached = clients.get(clientId);
  if (cached) return cached;
  const client = new OAuth2Client(clientId);
  clients.set(clientId, client);
  return client;
}
// #end-function
// #end-section
// #section Internal helpers
// #function ensurePayload - Validates and normalizes the token payload
/**
 * @description Valida y normaliza el payload de un token de Google contra issuer, audience, expiración y claims requeridos.
 * @purpose Centralizar las validaciones del payload JWT de Google para garantizar su integridad.
 * @context Utilizado internamente por validateGoogleToken tras la verificación criptográfica del token.
 * @param payload payload crudo retornado por la verificación de Google
 * @param clientId audience esperado (Google client ID del proyecto)
 * @param expectedIssuer issuer esperado (por defecto https://accounts.google.com)
 * @returns payload normalizado como GooglePayload
 * @throws GoogleTokenError con código y status HTTP cuando la validación falla
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function ensurePayload(payload: any, clientId: string, expectedIssuer: string): GooglePayload {
  if (!payload) {
    throw new GoogleTokenError("Token verification failed", GOOGLE_TOKEN_ERROR_CODES.VERIFICATION_FAILED, 401);
  }

  const issuer = payload.iss;
  if (issuer !== expectedIssuer) {
    throw new GoogleTokenError("Invalid issuer", GOOGLE_TOKEN_ERROR_CODES.INVALID_ISSUER, 401);
  }

  const audience = payload.aud;
  if (audience !== clientId) {
    throw new GoogleTokenError("Invalid audience", GOOGLE_TOKEN_ERROR_CODES.INVALID_AUDIENCE, 401);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && nowSeconds > payload.exp) {
    throw new GoogleTokenError("Token expired", GOOGLE_TOKEN_ERROR_CODES.TOKEN_EXPIRED, 401);
  }

  if (!payload.sub || !payload.email || !payload.name || !payload.picture || !payload.iat || !payload.exp) {
    throw new GoogleTokenError("Incomplete token payload", GOOGLE_TOKEN_ERROR_CODES.VERIFICATION_FAILED, 401);
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: Boolean(payload.email_verified),
    name: payload.name,
    picture: payload.picture,
    given_name: payload.given_name,
    family_name: payload.family_name,
    iat: payload.iat,
    exp: payload.exp,
    iss: payload.iss,
    aud: payload.aud,
  };
}
// #end-function
// #end-section
// #function validateGoogleToken - Verifies a Google ID token and returns its payload
/**
 * @description Verifica un Google ID token contra el client ID e issuer configurados.
 * @purpose Proveer la validación completa del token de Google con errores descriptivos para el consumidor.
 * @context Utilizado por el middleware de autenticación de Google en el servidor para validar tokens de login.
 * @param idToken string del ID token recibido del cliente de Google OAuth
 * @param options opciones opcionales de sobreescritura (clientId, expectedIssuer)
 * @returns payload de Google normalizado y listo para uso en el backend
 * @throws GoogleTokenError con code y status HTTP descriptivos si la validación falla
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export async function validateGoogleToken(
  idToken: unknown,
  options?: ValidateGoogleTokenOptions
): Promise<GooglePayload> {
  const token = typeof idToken === "string" ? idToken.trim() : "";
  if (!token) {
    throw new GoogleTokenError("Missing token", GOOGLE_TOKEN_ERROR_CODES.MISSING_TOKEN, 400);
  }

  const clientId = options?.clientId ?? validateGoogleTokenConfig.clientId;
  if (!clientId) {
    throw new GoogleTokenError("Missing Google client ID", GOOGLE_TOKEN_ERROR_CODES.MISSING_CLIENT_ID, 500);
  }

  const expectedIssuer = options?.expectedIssuer ?? validateGoogleTokenConfig.expectedIssuer ?? GOOGLE_TOKEN_ISSUER;

  try {
    const client = getClient(clientId);
    const ticket = await client.verifyIdToken({ idToken: token, audience: clientId });
    const payload = ticket.getPayload();
    return ensurePayload(payload, clientId, expectedIssuer);
  } catch (error) {
    if (error instanceof GoogleTokenError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Token verification failed";
    throw new GoogleTokenError(message, GOOGLE_TOKEN_ERROR_CODES.VERIFICATION_FAILED, 401);
  }
}
// #end-function
