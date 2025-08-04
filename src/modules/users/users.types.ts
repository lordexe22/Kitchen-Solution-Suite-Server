/* src\modules\users\users.types.ts */
// #type User
export interface User {
  name: string;
  email: string;
  password: string;
  registerDate: string;
  role: "admin" | "employ";
  accountStatus: "active" | "inactive";
}
// #end-type