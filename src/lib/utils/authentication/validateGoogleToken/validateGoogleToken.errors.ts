/* #info - Error classes for Google ID token validation */
import { GOOGLE_TOKEN_ERROR_CODES } from "./validateGoogleToken.constants";

// #class GoogleTokenError - Base error with code and status
/**
 * Base error for Google ID token validation failures. Includes machine-friendly code and HTTP status.
 * @extends Error
 * @param message Human-readable description of the failure
 * @param code One of GOOGLE_TOKEN_ERROR_CODES
 * @param status HTTP status code to surface (defaults to 500)
 */
export class GoogleTokenError extends Error {
  constructor(
    message: string,
    public readonly code: (typeof GOOGLE_TOKEN_ERROR_CODES)[keyof typeof GOOGLE_TOKEN_ERROR_CODES],
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "GoogleTokenError";
    Error.captureStackTrace?.(this, this.constructor);
  }
}
// #end-class
