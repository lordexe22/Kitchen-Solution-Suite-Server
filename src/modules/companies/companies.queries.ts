/* src\modules\companies\companies.queries.ts */
// #variable - VERIFY_COMPANY_OWNERSHIP
export const VERIFY_COMPANY_OWNERSHIP = `
  SELECT id FROM companies WHERE id = $1 AND owner_id = $2
`;
// #end-variable
// #variable - UPSERT_COMPANY_SOCIALS
export const UPSERT_COMPANY_SOCIALS = `
  INSERT INTO company_socials (
    company_id, facebook_url, instagram_url, x_url, tiktok_url, threads_url, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  ON CONFLICT (company_id) DO UPDATE SET
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    x_url = EXCLUDED.x_url,
    tiktok_url = EXCLUDED.tiktok_url,
    threads_url = EXCLUDED.threads_url,
    updated_at = NOW()
`;
// #end-variable
// #variable - INSERT_COMPANY
export const INSERT_COMPANY = `
  INSERT INTO companies (name, alias, owner_id, logo_url)
  VALUES ($1, $2, $3, $4)
  RETURNING id, name, alias, owner_id, logo_url, created_at, updated_at, is_active
`;
// #end-variable
// #variable - GET_MY_COMPANIES
export const GET_MY_COMPANIES = `
  SELECT id, name, alias, logo_url, created_at, updated_at, is_active
  FROM companies
  WHERE owner_id = $1
`;
// #end-variable
// #variable - GET_COMPANY_SOCIALS
export const GET_COMPANY_SOCIALS = `
  SELECT 
    facebook_url,
    instagram_url,
    x_url,
    tiktok_url,
    threads_url,
    updated_at
  FROM company_socials
  WHERE company_id = $1
`;
// #end-variable
// #variable - GET_COMPANY_LOCATION
export const GET_COMPANY_LOCATION = `
  SELECT 
    address,
    city,
    province,
    updated_at
  FROM company_locations
  WHERE company_id = $1
`;
// #end-variable
// #variable - UPSERT_COMPANY_LOCATION
export const UPSERT_COMPANY_LOCATION = `
  INSERT INTO company_locations (
    company_id, address, city, province, updated_at
  ) VALUES ($1, $2, $3, $4, NOW())
  ON CONFLICT (company_id) DO UPDATE SET
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    updated_at = NOW()
`;
// #end-variable
