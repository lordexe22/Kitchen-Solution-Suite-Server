# jwtCookieManager

A robust, framework-agnostic JWT management module for handling authentication tokens with support for token refresh flows and absolute session management.

## Overview

`jwtCookieManager` provides core JWT operations without tying you to a specific framework or cookie management library. It handles:

- **JWT Creation**: Generate signed tokens with automatic `originalIat` injection for session tracking
- **JWT Verification**: Decode and verify tokens with the configured secret
- **Token Refresh**: Re-sign existing tokens to extend expiration while preserving session identity
- **Cookie Integration**: Framework-agnostic cookie data generation for both setting and clearing tokens
- **Configuration Management**: Environment-driven setup with sensible defaults

## Environment Variables

All variables are optional except `JWT_SECRET`, which must be defined for the module to function.

```bash
# Secret key used to sign and verify JWT tokens (REQUIRED)
JWT_SECRET=your-secret-key-here

# Cookie name for storing JWT (defaults to "jwt_token")
JWT_COOKIE_NAME=jwt_token

# Time window before absolute expiration to allow token refresh (milliseconds, defaults to 60000 = 1 minute)
JWT_REFRESH_MS=60000

# Maximum absolute session lifetime (milliseconds, defaults to 604800000 = 7 days)
JWT_ABSOLUTE_SESSION_MS=604800000

# Runtime environment (defaults to "development", affects cookie secure flag)
NODE_ENV=development
```

## Core Concepts

### originalIat (Original Issued-At)

When a JWT is created or refreshed, the module injects an `originalIat` field into the payload. This timestamp marks when the session began and is preserved across all refreshes, enabling the system to enforce an absolute session lifetime independent of individual token expiration times.

**Example flow:**
1. User logs in at 10:00 → `originalIat = 10:00`
2. Token refreshed at 10:05 → new token, but `originalIat` still `10:00`
3. Token refreshed at 10:10 → new token, but `originalIat` still `10:00`
4. At 17:00 (7 days later) → session rejected despite recent refresh, because `(now - originalIat) > JWT_ABSOLUTE_SESSION_MS`

### Refresh Window

The refresh window (`JWT_REFRESH_MS`) defines how close to expiration a token must be before refresh is allowed. This logic is **not enforced** by the module—it's the caller's responsibility to check before invoking `refreshJWT()`.

- **Module responsibility**: Re-sign the token with fresh expiration
- **Caller responsibility**: Validate timing and decide whether refresh is eligible

## API Reference

### Token Management

#### `createJWT(payload: JwtPayload): string`

Creates a new signed JWT token.

- **Auto-injects** `originalIat` if not already present
- Expiration set to `JWT_ABSOLUTE_SESSION_MS / 1000` seconds
- **Throws**: `JwtPayloadError`, `JwtConfigurationError`, `JwtSignError`

```typescript
const token = createJWT({ userId: "123", email: "user@example.com" });
```

#### `refreshJWT(token: string): string`

Re-signs an existing JWT to extend its expiration.

- **Verifies** the token with the configured secret
- **Preserves** `originalIat` to maintain session identity
- **Regenerates** `iat` and `exp` claims
- **Does NOT** evaluate eligibility—caller must decide when to call
- **Throws**: `JwtPayloadError`, `JwtConfigurationError`, `JwtSignError`

```typescript
const refreshedToken = refreshJWT(existingToken);
```

#### `decodeJWT(token: string): JwtPayload`

Decodes and verifies a JWT token, returning the payload.

- **Throws**: `JwtPayloadError`, `JwtConfigurationError`, `JwtSignError`

```typescript
const payload = decodeJWT(token);
console.log(payload.userId);
```

### Cookie Operations

#### `setJWTCookie(token: string, options?: Partial<CookieConfig>): CookieData`

Generates framework-agnostic cookie data for setting a JWT.

- **Returns**: Object with `name`, `value`, and `options`
- **Default maxAge**: Aligns with `JWT_ABSOLUTE_SESSION_MS`
- **Always enforces**: `httpOnly: true`, `sameSite: "strict"`
- **Secure flag**: Automatically set based on `NODE_ENV` (true in production)

```typescript
const cookieData = setJWTCookie(token);
// Use with your framework:
// Express: res.cookie(cookieData.name, cookieData.value, cookieData.options);
// Next.js: cookies().set(cookieData.name, cookieData.value, cookieData.options);
```

#### `getJWTFromCookie(cookies: Record<string, string> | null | undefined): string | null`

Extracts JWT token from a cookies object.

- **Returns**: Token string or `null` if not found
- **Handles**: null/undefined cookies safely

```typescript
const token = getJWTFromCookie(req.cookies);
if (!token) {
  // No token found
}
```

#### `clearJWTCookie(options?: Partial<CookieConfig>): CookieData`

Generates cookie data for clearing/removing a JWT cookie.

- **Sets**: `maxAge: 0`, empty value
- **Preserves security**: `httpOnly: true`, `sameSite: "strict"`

```typescript
const clearData = clearJWTCookie();
// Use with your framework:
// Express: res.cookie(clearData.name, clearData.value, clearData.options);
```

### Configuration & Validation

#### `validateEnvironmentVariables(): void`

Validates that all required JWT environment variables are configured.

- Collects all missing variables and throws a single error
- **Throws**: `JwtConfigurationError` if any variable is missing

```typescript
// Call at application startup
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error("JWT configuration error:", error.message);
  process.exit(1);
}
```

#### `validatePayload(payload: unknown): asserts payload is JwtPayload`

Validates that a value is a valid JWT payload (non-null object, not an array).

- **Throws**: `JwtPayloadError`

```typescript
validatePayload(data); // Narrows type to JwtPayload
```

#### `getConfiguredRefreshMs(): number`

Returns the configured refresh window in milliseconds.

```typescript
const refreshWindow = getConfiguredRefreshMs(); // 60000 by default
```

#### `getConfiguredAbsoluteSessionMs(): number`

Returns the configured absolute session lifetime in milliseconds.

```typescript
const sessionLifetime = getConfiguredAbsoluteSessionMs(); // 604800000 by default
```

## Error Handling

The module defines custom error classes for precise error handling:

- **`JwtPayloadError`**: Invalid payload (null, array, non-object, etc.)
- **`JwtConfigurationError`**: Missing or invalid environment variables
- **`JwtSignError`**: Token signing, verification, or refresh failures

```typescript
import { JwtSignError, JwtConfigurationError } from "jwtCookieManager";

try {
  const token = refreshJWT(existingToken);
} catch (error) {
  if (error instanceof JwtSignError) {
    console.error("Token signature invalid or verification failed");
  }
}
```

## Usage Example: Complete Flow

```typescript
import {
  createJWT,
  refreshJWT,
  decodeJWT,
  setJWTCookie,
  getJWTFromCookie,
  validateEnvironmentVariables,
  JwtSignError,
} from "jwtCookieManager";

// 1. Validate configuration at startup
validateEnvironmentVariables();

// 2. Create token on login
const loginToken = createJWT({ userId: "user-456", email: "user@example.com" });

// 3. Set token in cookie (framework-specific implementation)
const cookieData = setJWTCookie(loginToken);
// res.cookie(cookieData.name, cookieData.value, cookieData.options);

// 4. Extract and verify token on protected route
const requestCookies = req.cookies; // or parse from request
const token = getJWTFromCookie(requestCookies);

if (!token) {
  return res.status(401).json({ error: "No token found" });
}

try {
  const payload = decodeJWT(token);
  req.user = payload; // Attach to request context
  next();
} catch (error) {
  return res.status(401).json({ error: "Invalid token" });
}

// 5. Refresh token when eligibility is confirmed
// (Your code checks refresh window before calling)
try {
  const refreshedToken = refreshJWT(token);
  const refreshCookieData = setJWTCookie(refreshedToken);
  // res.cookie(refreshCookieData.name, refreshCookieData.value, refreshCookieData.options);
} catch (error) {
  if (error instanceof JwtSignError) {
    console.error("Cannot refresh expired token");
  }
}

// 6. Clear token on logout
const clearData = clearJWTCookie();
// res.cookie(clearData.name, clearData.value, clearData.options);
```

## Testing

The module includes comprehensive test coverage via Vitest:

```bash
npm test
```

Tests verify:
- Token creation, verification, and refresh
- Payload validation and error handling
- Cookie data generation and extraction
- Configuration validation and getters
- Edge cases (null tokens, invalid formats, missing env vars)

## Security Considerations

- **JWT Secret**: Use a strong, randomly generated secret. Never commit to version control.
- **HttpOnly Cookies**: All cookies are forced to `httpOnly: true` to prevent XSS attacks.
- **CSRF Protection**: Combine with CSRF middleware in your framework (e.g., `csrf` for Express).
- **HTTPS in Production**: Cookie `secure` flag is automatically enabled when `NODE_ENV=production`.
- **Session Lifetime**: Adjust `JWT_ABSOLUTE_SESSION_MS` based on your security requirements.

## Related Documentation

- [JWT Authentication Best Practices](https://tools.ietf.org/html/rfc7519)
- [Cookie Security Flags](https://owasp.org/www-community/HTTPResponse)
- [Session Management Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
