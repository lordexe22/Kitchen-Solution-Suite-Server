/* src\db\queries.ts */
// #variable - CREATE_USER_TABLE
export const CREATE_USER_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    register_date TIMESTAMP NOT NULL,
    role TEXT NOT NULL,
    account_status TEXT NOT NULL
  )
`;
// #end-variable
// #variable - CREATE_COMPANY_TABLE
export const CREATE_COMPANY_TABLE = `
  CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )
`;
// #end-variable
// #variable - CREATE_SOCIAL_MEDIA_TABLE
export const CREATE_SOCIAL_MEDIA_TABLE = `
  CREATE TABLE IF NOT EXISTS company_socials (
    company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    facebook_url TEXT,
    instagram_url TEXT,
    x_url TEXT,
    tiktok_url TEXT,
    threads_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;
// #end-variable
// #variable - CREATE_LOCATION_TABLE
export const CREATE_LOCATION_TABLE = `
  CREATE TABLE IF NOT EXISTS company_locations (
    company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    address TEXT,
    city TEXT,
    province TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;
// #end-variable
