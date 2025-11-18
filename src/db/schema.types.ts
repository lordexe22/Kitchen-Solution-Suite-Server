/* src\db\schema.types.ts */
// #interface User
/** Table representing user accounts */
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
  type: 'admin' | 'employ' | 'guest' | 'dev';
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
  /** Timestamp of when the category was created */
  createdAt: Date;
  /** Timestamp of the last update to the category */
  updatedAt: Date;
}
// #end-interface
