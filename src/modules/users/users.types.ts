/* src\modules\users\users.types.ts */
// #type User
export interface User {
  name: string;
  email: string;
  password: string;
  registerDate: string;
  role: "admin" | "employ" | "dev" | "visitor";
  accountStatus: "active" | "inactive";
}
// #end-type