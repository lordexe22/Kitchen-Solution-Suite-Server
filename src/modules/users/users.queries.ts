/* src\modules\users\users.queries.ts */
// #variable INSERT_USER
export const INSERT_USER = `
  INSERT INTO users
  (name, email, password, register_date, role, account_status)
  VALUES ($1,$2,$3,$4,$5,$6)
  RETURNING id
`;
// #end-variable
// #variable SELECT_USER_BY_EMAIL
export const SELECT_USER_BY_EMAIL = `
  SELECT id, name, email, password, role FROM users WHERE email = $1
`;
// #end-variable
