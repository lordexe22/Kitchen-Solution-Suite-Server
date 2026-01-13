/* #info - Error classes for jwtCookieManager */

// #class JwtError - Base error class for JWT operations
/**
 * Base error class for all JWT-related errors.
 * Extends the native Error class with additional properties for error codes and HTTP status.
 * @extends Error
 */
export class JwtError extends Error {
  /**
   * Creates a new JwtError instance.
   * @param message - Human-readable error message
   * @param code - Machine-readable error code for programmatic handling
   * @param status - HTTP status code (defaults to 500)
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "JwtError";
    Error.captureStackTrace(this, this.constructor);
  }
}
// #end-class

// #class JwtSignError - Error thrown when JWT signing fails
/**
 * Error thrown when JWT token signing or verification fails.
 * This includes scenarios like invalid secrets, malformed tokens, or expired tokens.
 * @extends JwtError
 */
export class JwtSignError extends JwtError {
  /**
   * Creates a new JwtSignError instance.
   * @param message - Error message (defaults to "Failed to sign JWT")
   * @param originalError - Optional original error that caused the failure
   */
  constructor(message: string = "Failed to sign JWT", originalError?: unknown) {
    const errorMessage = originalError instanceof Error 
      ? `${message}: ${originalError.message}` 
      : message;
    super(errorMessage, "JWT_SIGN_FAILED", 500);
    this.name = "JwtSignError";
  }
}
// #end-class

// #class JwtConfigurationError - Error thrown when configuration is invalid
/**
 * Error thrown when JWT module configuration is missing or invalid.
 * This typically occurs when required environment variables are not set.
 * @extends JwtError
 */
export class JwtConfigurationError extends JwtError {
  /**
   * Creates a new JwtConfigurationError instance.
   * @param message - Error message describing the configuration issue
   */
  constructor(message: string = "JWT configuration is invalid") {
    super(message, "JWT_CONFIGURATION_ERROR", 500);
    this.name = "JwtConfigurationError";
  }
}
// #end-class

// #class JwtPayloadError - Error thrown when payload validation fails
/**
 * Error thrown when JWT payload validation fails.
 * This occurs when the payload structure is invalid (not an object, null, array, etc.).
 * @extends JwtError
 */
export class JwtPayloadError extends JwtError {
  /**
   * Creates a new JwtPayloadError instance.
   * @param message - Error message describing the validation failure
   */
  constructor(message: string = "Invalid JWT payload") {
    super(message, "JWT_PAYLOAD_ERROR", 400);
    this.name = "JwtPayloadError";
  }
}
// #end-class
