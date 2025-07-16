// #typedef User
export interface User {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName?: string;
  registerDate: string;
  role: "admin";
  accountStatus: "free";
}
// #end-typedef