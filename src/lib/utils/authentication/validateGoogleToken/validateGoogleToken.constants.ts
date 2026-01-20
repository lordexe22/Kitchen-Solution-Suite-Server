/* #info - Constants for Google ID token validation */
// #const GOOGLE_TOKEN_ISSUER - Expected issuer for Google ID tokens
export const GOOGLE_TOKEN_ISSUER = "https://accounts.google.com" as const;
// #end-const
// #const GOOGLE_TOKEN_ERROR_CODES - Machine-readable error codes used by the validator
export const GOOGLE_TOKEN_ERROR_CODES = {
  MISSING_TOKEN: "MISSING_TOKEN",
  MISSING_CLIENT_ID: "MISSING_CLIENT_ID",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  INVALID_ISSUER: "INVALID_ISSUER",
  INVALID_AUDIENCE: "INVALID_AUDIENCE",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
} as const;
// #end-const
