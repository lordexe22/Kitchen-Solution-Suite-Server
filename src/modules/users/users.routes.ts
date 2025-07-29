// src\routes\usuarios.ts
// #section Imports
import { Router } from "express";
import { registerUser, loginUser } from "./users.middlewares";
// #end-section
// #variable useRouter
const userRouter = Router();
// #end-variable
// #route POST >> /register
userRouter.post("/register", registerUser);
// #end-route
// #route POST >> /login
userRouter.post("/login", loginUser);
// #end-route
export default userRouter;
