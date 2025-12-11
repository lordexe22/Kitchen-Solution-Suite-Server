/* src/services/invitations/invitations.types.ts */

// #type InvitationCreateDTO
/**
 * DTO para crear una nueva invitación de empleado.
 * 
 * El ownership selecciona una sucursal y el sistema genera el token.
 */
export interface InvitationCreateDTO {
  branchId: number;
  companyId: number;
  expirationDays?: number; // Opcional, default 30 días
}
// #end-type

// #type InvitationResponse
/**
 * Respuesta al crear una invitación.
 * 
 * Retorna el token para armar el enlace de invitación.
 */
export interface InvitationResponse {
  id: number;
  token: string;
  branchId: number;
  companyId: number;
  expiresAt: Date;
  createdAt: Date;
  invitationUrl: string; // URL completa para compartir
}
// #end-type

// #type InvitationValidationPayload
/**
 * Datos que se extraen al validar una invitación.
 * 
 * Se usa para pre-rellenar el formulario de registro y asignar el employee a la sucursal correcta.
 */
export interface InvitationValidationPayload {
  valid: boolean;
  token: string;
  branchId: number;
  companyId: number;
  branchName: string;
  companyName: string;
  expiresAt: Date;
  expiresIn: {
    days: number;
    hours: number;
    minutes: number;
  };
  error?: string;
}
// #end-type
