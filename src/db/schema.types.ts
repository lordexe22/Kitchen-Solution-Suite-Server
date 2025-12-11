/* src\db\schema.types.ts */
// #interface User
/** 
 * Table representing user accounts.
 * 
 * Supports multiple user types:
 * - admin: Owner of companies, full control
 * - employee: Assigned to ONE branch with specific permissions
 * - guest: Visitor, read-only access to public resources
 * - dev: Developer with special access
 */
export interface User {
  /** Unique identifier for the user */
  id: number;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's email address */
  email: string;
  /** Hashed password for the user */
  passwordHash: string;
  /** Role of the user in the system */
  type: 'admin' | 'employee' | 'guest' | 'dev';
  /** FK to branch (only for employee type, nullable) */
  branchId?: number | null;
  /** JSON string with granular permissions (only for employee type, nullable) */
  permissions?: string | null;
  /** Timestamp of when the user was created */
  createdAt: Date;
  /** Timestamp of the last update to the user */
  updatedAt: Date;
  /** Indicates if the user account is active */
  isActive: boolean;
  /** Current state of the user account */
  state: 'pending' | 'active' | 'suspended';
  /** URL to the user's profile image */
  imageUrl?: string | null;
}
// #end-interface
// #interface UserTag
/** 
 * Tabla de etiquetas personalizadas de usuarios.
 * 
 * Almacena las configuraciones de tags custom creados por cada usuario.
 */
export interface UserTag {
  /** Unique identifier for the tag */
  id: number;
  /** Reference to the user who created the tag */
  userId: number;
  /** Complete tag configuration (JSON string) */
  tagConfig: string;
  /** Timestamp of when the tag was created */
  createdAt: Date;
  /** Timestamp of the last update */
  updatedAt: Date;
}
// #end-interface
// #interface API_Platforms
/** Table to link user accounts with external platforms */
export interface API_Platforms {
  /** Reference to the user */
  userId: number;
  /** Name of the external platform */
  platformName: 'local' | 'google' | 'facebook' | 'x';
  /** Token provided by the external platform */
  platformToken: string;
  /** Timestamp of when the account was linked */
  linkedAt: Date;
}
// #end-interface
// #interface Company
/** 
 * Tabla de compañías/marcas corporativas.
 * 
 * Representa SOLO la marca, no las sucursales.
 * Cada usuario puede tener múltiples compañías.
 * 
 * Ejemplo:
 * - Usuario "Juan" crea Company "Grido"
 * - Usuario "María" crea Company "Pizzería La Esquina"
 */
export interface Company {
  /** Unique identifier for the company */
  id: number;
  /** Unique name of the company/brand (required) */
  name: string;
  /** Optional corporate description (max 500 characters) */
  description?: string | null;
  /** Reference to the user who owns this company */
  ownerId: number;
  /** URL to the company logo (pending Cloudinary integration) */
  logoUrl?: string | null;
  /** Timestamp of when the company was created */
  createdAt: Date;
  /** Timestamp of the last update to the company */
  updatedAt: Date;
  /** Indicates if the company is active (false = soft deleted) */
  isActive: boolean;
  /** Timestamp of when the company was soft deleted (null = not deleted) */
  deletedAt?: Date | null;
}
// #end-interface
// #interface Branch
/** 
 * Tabla de sucursales/locales físicos.
 * 
 * Representa una sucursal de una compañía.
 * El nombre es opcional (nullable).
 * La ubicación es opcional y está en tabla separada.
 */
export interface Branch {
  /** Unique identifier for the branch */
  id: number;
  /** Reference to the company that owns this branch */
  companyId: number;
  /** Optional custom name for the branch (nullable) */
  name?: string | null;
  /** Timestamp of when the branch was created */
  createdAt: Date;
  /** Timestamp of the last update to the branch */
  updatedAt: Date;
  /** Indicates if the branch is active (false = soft deleted) */
  isActive: boolean;
  /** Timestamp of when the branch was soft deleted (null = not deleted) */
  deletedAt?: Date | null;
}
// #end-interface
// #interface BranchLocation
/** 
 * Tabla de ubicaciones físicas de sucursales.
 * 
 * Almacena la dirección y coordenadas de una sucursal.
 * Relación 1:1 con Branch (una sucursal = una ubicación).
 */
export interface BranchLocation {
  /** Unique identifier for the location */
  id: number;
  /** Reference to the branch (unique - one branch = one location) */
  branchId: number;
  /** Full physical address (required) */
  address: string;
  /** City name (required) */
  city: string;
  /** State/Province name (required) */
  state: string;
  /** Country name (required) */
  country: string;
  /** Optional postal/ZIP code */
  postalCode?: string | null;
  /** Optional GPS latitude coordinate */
  latitude?: string | null;
  /** Optional GPS longitude coordinate */
  longitude?: string | null;
  /** Timestamp of when the location was created */
  createdAt: Date;
  /** Timestamp of the last update to the location */
  updatedAt: Date;
}
// #end-interface
// #interface BranchSocial
/** 
 * Tabla de redes sociales de sucursales.
 * 
 * Almacena los enlaces a redes sociales de cada sucursal.
 * Una sucursal puede tener múltiples redes sociales.
 */
export interface BranchSocial {
  /** Unique identifier for the social media entry */
  id: number;
  /** Reference to the branch */
  branchId: number;
  /** Social media platform name (facebook, instagram, twitter, etc.) */
  platform: string;
  /** URL to the social media profile */
  url: string;
  /** Timestamp of when the entry was created */
  createdAt: Date;
  /** Timestamp of the last update */
  updatedAt: Date;
}
// #end-interface
// #interface BranchSchedule
/** 
 * Tabla de horarios de atención de sucursales.
 * 
 * Almacena los horarios de apertura/cierre para cada día de la semana.
 * Una sucursal puede tener múltiples horarios (uno por día).
 */
export interface BranchSchedule {
  /** Unique identifier for the schedule entry */
  id: number;
  /** Reference to the branch */
  branchId: number;
  /** Day of the week (monday, tuesday, wednesday, thursday, friday, saturday, sunday) */
  dayOfWeek: string;
  /** Opening time in HH:MM format (24-hour) */
  openTime?: string | null;
  /** Closing time in HH:MM format (24-hour) */
  closeTime?: string | null;
  /** Indicates if the branch is closed on this day */
  isClosed: boolean;
  /** Timestamp of when the entry was created */
  createdAt: Date;
  /** Timestamp of the last update */
  updatedAt: Date;
}
// #end-interface
// #interface Category
/** 
 * Tabla de categorías de productos.
 * 
 * Almacena las categorías que organizan los productos de cada sucursal.
 * Una categoría pertenece a una sucursal y contendrá productos.
 */
export interface Category {
  /** Unique identifier for the category */
  id: number;
  /** Reference to the branch */
  branchId: number;
  /** Category name (required, max 100 chars) */
  name: string;
  /** Optional description (max 500 chars) */
  description?: string | null;
  /** Optional image URL (Cloudinary) */
  imageUrl?: string | null;
  /** Text color in hex format (default: #FFFFFF) */
  textColor: string;
  /** Background mode: 'solid' or 'gradient' */
  backgroundMode: 'solid' | 'gradient';
  /** Background color in hex format (default: #3B82F6) */
  backgroundColor: string;
  /** Gradient configuration (JSON string if backgroundMode is 'gradient') */
  gradientConfig?: string | null;
  /** Display order (lower = first) */
  sortOrder: number;
  /** Timestamp of when the category was created */
  createdAt: Date;
  /** Timestamp of the last update to the category */
  updatedAt: Date;
}
// #end-interface
// #interface Product
/** 
 * Tabla de productos.
 * 
 * Almacena los productos que se venden en cada categoría.
 * Relación: Una categoría puede tener múltiples productos.
 */
export interface Product {
  /** Unique identifier for the product */
  id: number;
  /** Reference to the category */
  categoryId: number;
  /** Product name (required, max 100 chars) */
  name: string;
  /** Optional description (max 1000 chars) */
  description?: string | null;
  /** Array of image URLs (JSON string, first = main image) */
  images?: string | null;
  /** Array of tags assigned to product (JSON string of TagConfiguration[]) */
  tags?: string | null;
  /** Base price (decimal 10,2) */
  basePrice: string; // Viene como string desde decimal de DB
  /** Discount percentage 0-100 (decimal 5,2) */
  discount?: string | null; // Viene como string desde decimal de DB
  /** If product has stock control enabled */
  hasStockControl: boolean;
  /** Current stock quantity (nullable if no control) */
  currentStock?: number | null;
  /** Stock alert threshold (notify when below this) */
  stockAlertThreshold?: number | null;
  /** Stock stop threshold (disable product when below this) */
  stockStopThreshold?: number | null;
  /** Product availability (manual or automatic by stock) */
  isAvailable: boolean;
  /** Display order (lower = first) */
  sortOrder: number;
  /** Timestamp of when the product was created */
  createdAt: Date;
  /** Timestamp of the last update to the product */
  updatedAt: Date;
}
// #end-interface

// #interface EmployeeInvitation
/**
 * Invitación para que nuevos usuarios se registren como empleados.
 * 
 * Token temporal con una sola oportunidad de uso y expiración automática.
 */
export interface EmployeeInvitation {
  /** Unique identifier */
  id: number;
  /** Unique token used in invitation URL */
  token: string;
  /** FK to branch where employee will be assigned */
  branchId: number;
  /** FK to company (denormalized for quick queries) */
  companyId: number;
  /** userId of the owner who created this invitation */
  createdBy: number;
  /** Expiration date/time of the token */
  expiresAt: Date;
  /** When this invitation was used (null = unused) */
  usedAt?: Date | null;
  /** userId of who used this token (null = unused) */
  usedByUserId?: number | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Soft delete flag */
  isActive: boolean;
}
// #end-interface

