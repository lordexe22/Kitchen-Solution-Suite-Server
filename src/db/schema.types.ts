/* src\db\table.types.ts */
// #interface User
/** Table representing user accounts */
export interface User {
  /** Unique identifier for the user */
  id: string;
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
  imageUrl?: string;
}
// #end-interface
// #interface API_Platforms
/** Table to link user accounts with external platforms */
export interface API_Platforms {
  /** Reference to the user */
  userId: string;
  /** Name of the external platform */
  platformName: 'local' | 'google' | 'facebook' | 'x';
  /** Token provided by the external platform */
  platformToken: string;
  /** Timestamp of when the account was linked */
  linkedAt: Date;
}
// #end-interface
