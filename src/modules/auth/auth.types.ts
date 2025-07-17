// src/modules/auth/auth.types.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    // agregá aquí las propiedades que incluya tu payload JWT
  };
}
