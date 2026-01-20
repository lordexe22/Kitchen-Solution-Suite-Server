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
 * Returns a cached OAuth2Client for the given clientId or creates and stores a new one.
 * @param clientId Google OAuth client ID
 * @returns OAuth2Client instance bound to the provided clientId
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
 * Validates the ID token payload against issuer, audience, expiration and required claims.
 * @param payload Raw payload returned by Google verification
 * @param clientId Expected audience (your Google client ID)
 * @param expectedIssuer Expected issuer (defaults to https://accounts.google.com)
 * @throws GoogleTokenError with detailed code/status when validation fails
 * @returns Normalized GooglePayload
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
 * Verifies a Google ID token against the provided client ID and issuer.
 * @param idToken Raw ID token string received from the client
 * @param options Optional overrides (clientId, expectedIssuer)
 * @throws GoogleTokenError with machine-friendly `code` and HTTP `status`
 * @returns Normalized GooglePayload ready for backend use
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
