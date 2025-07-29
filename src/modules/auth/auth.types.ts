// src/modules/auth/auth.types.ts
// #section Imports
import { Request } from 'express';
// #end-section
// #type AuthenticatedRequest
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    // agregá aquí las propiedades que incluya tu payload JWT
  };
}
// #end-type
