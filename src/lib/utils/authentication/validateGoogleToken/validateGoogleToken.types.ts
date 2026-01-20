/* #info - Types for Google ID token validation */
// #type GooglePayload - Normalized Google ID token payload
export interface GooglePayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
// #end-type
// #type ValidateGoogleTokenOptions - Optional overrides for validation behavior
export interface ValidateGoogleTokenOptions {
  /** Google OAuth Client ID to validate against; defaults to env GOOGLE_CLIENT_ID */
  clientId?: string;
  /** Expected issuer; defaults to https://accounts.google.com */
  expectedIssuer?: string;
}
// #end-type
