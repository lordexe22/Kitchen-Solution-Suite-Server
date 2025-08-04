// src/modules/auth/auth.middlewares.ts
// #section Imports
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
import { getTokenFromHeader, isTokenValid, getTokenPayload } from './auth.utils';
import { pool } from '../../db/pool';
// #end-section
// #middleware validateJWTAndGetPayload - Validates the JWT, extracts the user payload and assigns it to req.user
/**
 * Middleware that validates the JWT provided in the Authorization header.
 * 
 * Steps:
 * 1. Extracts and verifies the token.
 * 2. Decodes the payload and assigns it to `req.user`.
 * 3. Returns 401 if the token is missing, invalid, or expired.
 * 
 * Usage:
 * Place this at the beginning of any route that requires JWT-based authentication.
 */
export const validateJWTAndGetPayload = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // #variable - authHeader, token, isValid, payload
    const authHeader = req.headers.authorization;
    const token = getTokenFromHeader(authHeader);
    const isValid = isTokenValid(token);
    const payload = getTokenPayload(token) as AuthenticatedRequest['user'];
    // #end-variable
    // #step 1 - Check for token existence
    if (!token) {
      throw { status: 401, message: 'Invalid or missing authorization header' };
    }
    // #end-step
    // #step 2 - Check token validity
    if (!isValid) {
      throw { status: 401, message: 'Invalid or expired token' };
    }
    // #end-step
    // #step 3 - Check if the payload is decodable
    if (!payload) {
      throw { status: 401, message: 'Failed to decode token payload' };
    }
    // #end-step
    // #step 4 - Assign payload to req.user
    req.user = payload;
    // #end-step
    // #step 5 - Call next() to proceed to the next middleware function
    next();
    // #end-step
  } catch (error: any) {
    // #step 6 - Handles exceptions showing error message and returning status and error message to the client
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    console.error(`[validateJWTAndGetPayload] ${status} - ${message}`);
    res.status(status).json({
      message,
    });    
    // #end-step
  }
}
// #end-middleware
// #middleware validateAccountStatus - Validate the account status
/**
 * Middleware that checks the user's account status from the database.
 * 
 * Steps:
 * 1. Retrieves `user.id` from `req.user` (populated by the JWT middleware).
 * 2. Queries the database for the user's `account_status`.
 * 3. If the user does not exist or the status is not 'active', returns 403.
 * 
 * Usage:
 * Use after `validateJWTAndGetPayload` on routes that require an active user account.
 */
export const validateAccountStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // #variable userId
    const userId = req.user?.id;
    // #end-variable
    // #step 1 - Validate userId
    if (!userId) {
      throw { status: 401, message: 'Missing user ID in request' };
    }
    // #end-step
    // #step 2 - Query user data from pgSQL db using the user id
    const result = await pool.query(
      'SELECT account_status FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    // #end-step
    // #step 3 - Eval if the user exists into the db
    if (result.rowCount === 0) {
      throw { status: 403, message: 'User does not exist' };
    }
    // #end-step
    // #step 4 - Eval the user account status ('active', 'inactive')
    const { account_status } = result.rows[0];
    if (account_status !== 'active') {
      throw { status: 403, message: 'User account is not active' };
    }
    // #end-step
    // #step 5 - Pass the control to the next middleware
    next();
    // #end-step
  } catch (err: any) {
    // #step 6 - Handles exceptions showing error message and returning status and error message to the client
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    console.error(`[validateAccountStatus] ${status} - ${message}`);
    res.status(status).json({
      message,
    });
    // #end-step
  }
};
// #end-middleware
