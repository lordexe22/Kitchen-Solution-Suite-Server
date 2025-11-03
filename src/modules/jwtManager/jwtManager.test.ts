/* src/modules/jwtManager/jwtManager.test.ts */
// #section imports
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response, NextFunction, CookieOptions } from 'express';
import {
  signJWT,
  verifyJWT,
  isTokenValid,
  getTokenFromHeader,
  setJWTCookie,
  clearJWTCookie,
  getJWTFromCookie,
  hasJWTCookie
} from './jwtManager.utils';
import {
  authenticateJWT,
  optionalAuth,
  validateJWTAndGetPayload
} from './jwtManager.middlewares';
import type { JWTPayload, AuthenticatedRequest } from './jwtManager.types';
import { JWT_CONFIG } from './jwtManager.config';
// #end-section

// #section test helpers
/**
 * Mock de Request de Express
 */
const createMockRequest = (overrides?: Partial<Request>): Request => {
  return {
    cookies: {},
    headers: {},
    ...overrides
  } as Request;
};

/**
 * Mock de Response de Express con tipado correcto
 */
const createMockResponse = (): Response => {
  const res: any = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res as Response;
};

/**
 * Mock de NextFunction
 */
const createMockNext = (): NextFunction => {
  return jest.fn() as NextFunction;
};
// #end-section

// #section Utils Tests
describe('jwtManager.utils', () => {
  
  // #test signJWT
  describe('signJWT', () => {
    
    it('should generate a valid JWT token', () => {
      const payload: JWTPayload = { userId: 123 };
      const token = signJWT(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tiene 3 partes separadas por puntos
    });

    it('should include userId in the token payload', () => {
      const payload: JWTPayload = { userId: 456, email: 'test@example.com' };
      const token = signJWT(payload);
      const decoded = verifyJWT(token);
      
      expect(decoded.userId).toBe(456);
      expect(decoded.email).toBe('test@example.com');
    });

    it('should create token with custom expiration', () => {
      const payload: JWTPayload = { userId: 789 };
      const token = signJWT(payload, '1h');
      const decoded = verifyJWT(token);
      
      expect(decoded.userId).toBe(789);
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error if userId is missing', () => {
      const invalidPayload = {} as JWTPayload;
      
      expect(() => signJWT(invalidPayload)).toThrow('JWT payload must include userId');
    });
  });
  // #end-test

  // #test verifyJWT
  describe('verifyJWT', () => {
    
    it('should verify and decode a valid token', () => {
      const payload: JWTPayload = { userId: 100, email: 'user@test.com' };
      const token = signJWT(payload);
      const decoded = verifyJWT(token);
      
      expect(decoded.userId).toBe(100);
      expect(decoded.email).toBe('user@test.com');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyJWT(invalidToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      
      expect(() => verifyJWT(malformedToken)).toThrow();
    });

    it('should throw error for expired token', async () => {
      const payload: JWTPayload = { userId: 200 };
      const expiredToken = signJWT(payload, '1ms'); // Token expira en 1 milisegundo
      
      // Esperar para asegurar expiración
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(() => verifyJWT(expiredToken)).toThrow();
    });

    it('should decode token with userId successfully', () => {
      const payload: JWTPayload = { userId: 300 };
      const token = signJWT(payload);
      const decoded = verifyJWT(token);
      
      expect(decoded.userId).toBe(300);
    });
  });
  // #end-test

  // #test isTokenValid
  describe('isTokenValid', () => {
    
    it('should return true for valid token', () => {
      const payload: JWTPayload = { userId: 400 };
      const token = signJWT(payload);
      
      expect(isTokenValid(token)).toBe(true);
    });

    it('should return false for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(isTokenValid(invalidToken)).toBe(false);
    });

    it('should return false for null token', () => {
      expect(isTokenValid(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isTokenValid('')).toBe(false);
    });

    it('should return false for expired token', async () => {
      const payload: JWTPayload = { userId: 500 };
      const expiredToken = signJWT(payload, '1ms');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(isTokenValid(expiredToken)).toBe(false);
    });
  });
  // #end-test

  // #test getTokenFromHeader
  describe('getTokenFromHeader', () => {
    
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const headerValue = `Bearer ${token}`;
      
      expect(getTokenFromHeader(headerValue)).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(getTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for invalid format (no Bearer)', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      const headerValue = `Basic ${token}`;
      
      expect(getTokenFromHeader(headerValue)).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      expect(getTokenFromHeader('Bearer')).toBeNull();
      expect(getTokenFromHeader('Bearer ')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getTokenFromHeader('')).toBeNull();
    });
  });
  // #end-test

  // #test Cookie functions
  describe('Cookie functions', () => {
    
    describe('setJWTCookie', () => {
      it('should set cookie with correct name and options', () => {
        const res = createMockResponse();
        const token = 'test.token.here';
        
        setJWTCookie(res, token);
        
        expect(res.cookie).toHaveBeenCalledWith(
          JWT_CONFIG.cookieName,
          token,
          JWT_CONFIG.cookieOptions
        );
      });
    });

    describe('clearJWTCookie', () => {
      it('should clear cookie with correct name and path', () => {
        const res = createMockResponse();
        
        clearJWTCookie(res);
        
        expect(res.clearCookie).toHaveBeenCalledWith(
          JWT_CONFIG.cookieName,
          { path: JWT_CONFIG.cookieOptions.path }
        );
      });
    });

    describe('getJWTFromCookie', () => {
      it('should extract token from cookies', () => {
        const token = 'test.token.here';
        const req = createMockRequest({
          cookies: { [JWT_CONFIG.cookieName]: token }
        });
        
        expect(getJWTFromCookie(req)).toBe(token);
      });

      it('should return null if cookie not present', () => {
        const req = createMockRequest({ cookies: {} });
        
        expect(getJWTFromCookie(req)).toBeNull();
      });

      it('should return null if cookies object is undefined', () => {
        const req = createMockRequest();
        delete (req as any).cookies;
        
        // ⬇️ AGREGAR ESTO para suprimir el warning en este test específico
        const originalWarn = console.warn;
        console.warn = jest.fn();
        
        expect(getJWTFromCookie(req)).toBeNull();
        
        // ⬇️ RESTAURAR console.warn
        console.warn = originalWarn;
      });
    });

    describe('hasJWTCookie', () => {
      it('should return true if cookie exists', () => {
        const req = createMockRequest({
          cookies: { [JWT_CONFIG.cookieName]: 'token' }
        });
        
        expect(hasJWTCookie(req)).toBe(true);
      });

      it('should return false if cookie does not exist', () => {
        const req = createMockRequest({ cookies: {} });
        
        expect(hasJWTCookie(req)).toBe(false);
      });
    });
  });
  // #end-test
});
// #end-section

// #section Middleware Tests
describe('jwtManager.middlewares', () => {
  
  // #test authenticateJWT
  describe('authenticateJWT', () => {
    
    it('should call next() with valid token in cookie', () => {
      const payload: JWTPayload = { userId: 1000 };
      const token = signJWT(payload);
      
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: token }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      authenticateJWT(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(1000);
    });

    it('should call next() with valid token in Authorization header', () => {
      const payload: JWTPayload = { userId: 2000 };
      const token = signJWT(payload);
      
      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      authenticateJWT(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(2000);
    });

    it('should return 401 if no token provided', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: 'invalid.token.here' }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const payload: JWTPayload = { userId: 3000 };
      const expiredToken = signJWT(payload, '1ms');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: expiredToken }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      authenticateJWT(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
  // #end-test

  // #test optionalAuth
  describe('optionalAuth', () => {
    
    it('should attach user if valid token exists', () => {
      const payload: JWTPayload = { userId: 4000 };
      const token = signJWT(payload);
      
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: token }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(4000);
    });

    it('should call next() even without token', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should call next() even with invalid token', () => {
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: 'invalid.token' }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should not throw error with expired token', async () => {
      const payload: JWTPayload = { userId: 5000 };
      const expiredToken = signJWT(payload, '1ms');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: expiredToken }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      expect(() => optionalAuth(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
  // #end-test

  // #test validateJWTAndGetPayload
  describe('validateJWTAndGetPayload', () => {
    
    it('should behave identically to authenticateJWT with valid token', () => {
      const payload: JWTPayload = { userId: 6000 };
      const token = signJWT(payload);
      
      const req = createMockRequest({
        cookies: { [JWT_CONFIG.cookieName]: token }
      }) as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      validateJWTAndGetPayload(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(6000);
    });

    it('should return 401 without token', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      const res = createMockResponse();
      const next = createMockNext();
      
      validateJWTAndGetPayload(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
  // #end-test
});
// #end-section

// #section Integration Tests
describe('jwtManager - Integration tests', () => {
  
  it('should complete full authentication flow', () => {
    // 1. Crear token
    const payload: JWTPayload = { userId: 7000, email: 'integration@test.com' };
    const token = signJWT(payload);
    
    // 2. Guardar en cookie (simular)
    const req = createMockRequest({
      cookies: { [JWT_CONFIG.cookieName]: token }
    }) as AuthenticatedRequest;
    const res = createMockResponse();
    const next = createMockNext();
    
    // 3. Autenticar con middleware
    authenticateJWT(req, res, next);
    
    // 4. Verificar que el middleware funcionó
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    
    // 5. Verificar datos del usuario
    expect(req.user?.userId).toBe(7000);
    expect(req.user?.email).toBe('integration@test.com');
    
    // 6. Verificar token manualmente
    const decoded = verifyJWT(token);
    expect(decoded.userId).toBe(7000);
  });

  it('should handle token refresh scenario', () => {
    // 1. Crear token inicial
    const payload: JWTPayload = { userId: 8000 };
    const oldToken = signJWT(payload, '1h');
    
    // 2. Verificar token viejo
    const oldDecoded = verifyJWT(oldToken);
    expect(oldDecoded.userId).toBe(8000);
    
    // 3. Crear nuevo token (simular refresh)
    const newToken = signJWT({ userId: oldDecoded.userId }, '30d');
    
    // 4. Verificar nuevo token
    const newDecoded = verifyJWT(newToken);
    expect(newDecoded.userId).toBe(8000);
    
    // 5. Verificar que ambos tokens son diferentes
    expect(newToken).not.toBe(oldToken);
  });

  it('should handle logout scenario', () => {
    // 1. Crear sesión activa
    const payload: JWTPayload = { userId: 9000 };
    const token = signJWT(payload);
    
    const req = createMockRequest({
      cookies: { [JWT_CONFIG.cookieName]: token }
    }) as AuthenticatedRequest;
    const res = createMockResponse();
    
    // 2. Verificar que tiene cookie
    expect(hasJWTCookie(req)).toBe(true);
    
    // 3. Hacer logout (limpiar cookie)
    clearJWTCookie(res);
    
    // 4. Verificar que se llamó clearCookie
    expect(res.clearCookie).toHaveBeenCalledWith(
      JWT_CONFIG.cookieName,
      { path: JWT_CONFIG.cookieOptions.path }
    );
  });

  it('should prioritize cookie over header when both exist', () => {
    const cookiePayload: JWTPayload = { userId: 10000 };
    const headerPayload: JWTPayload = { userId: 20000 };
    
    const cookieToken = signJWT(cookiePayload);
    const headerToken = signJWT(headerPayload);
    
    const req = createMockRequest({
      cookies: { [JWT_CONFIG.cookieName]: cookieToken },
      headers: { authorization: `Bearer ${headerToken}` }
    }) as AuthenticatedRequest;
    const res = createMockResponse();
    const next = createMockNext();
    
    authenticateJWT(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe(10000); // Debe usar el de la cookie
  });
});
// #end-section

// #section Edge Cases
describe('jwtManager - Edge cases', () => {
  
  it('should handle very long expiration times', () => {
    const payload: JWTPayload = { userId: 11000 };
    const token = signJWT(payload, '365d'); // 1 año
    
    const decoded = verifyJWT(token);
    expect(decoded.userId).toBe(11000);
  });

  it('should handle tokens with additional custom fields', () => {
    const payload: JWTPayload = {
      userId: 12000,
      email: 'custom@test.com',
      role: 'admin'
    };
    const token = signJWT(payload);
    
    const decoded = verifyJWT(token);
    expect(decoded.userId).toBe(12000);
    expect(decoded.email).toBe('custom@test.com');
    expect(decoded.role).toBe('admin');
  });

  it('should handle malformed Bearer header formats', () => {
    // ❌ Formatos completamente inválidos
    expect(getTokenFromHeader('BearerTOKEN')).toBeNull();
    expect(getTokenFromHeader('bearer TOKEN')).toBeNull();
    expect(getTokenFromHeader('BEARER TOKEN')).toBeNull();
    expect(getTokenFromHeader('Basic TOKEN')).toBeNull();
    expect(getTokenFromHeader('Bearer')).toBeNull();
    expect(getTokenFromHeader('Bearer ')).toBeNull();
    expect(getTokenFromHeader('')).toBeNull();
    
    // ✅ Formatos válidos (se normalizan automáticamente)
    expect(getTokenFromHeader('Bearer TOKEN')).toBe('TOKEN');
    expect(getTokenFromHeader('Bearer  TOKEN')).toBe('TOKEN'); // doble espacio
    expect(getTokenFromHeader(' Bearer TOKEN')).toBe('TOKEN'); // espacio al inicio
    expect(getTokenFromHeader('Bearer TOKEN ')).toBe('TOKEN'); // espacio al final
    expect(getTokenFromHeader('  Bearer   TOKEN  ')).toBe('TOKEN'); // múltiples espacios
  });

  it('should handle concurrent token operations', () => {
    const tokens = Array.from({ length: 10 }, (_, i) => {
      const payload: JWTPayload = { userId: 13000 + i };
      return signJWT(payload);
    });
    
    tokens.forEach((token, index) => {
      const decoded = verifyJWT(token);
      expect(decoded.userId).toBe(13000 + index);
    });
  });
});
// #end-section