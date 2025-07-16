// src\routes\usuarios.ts

import { Router } from "express";
import { registerUser, loginUser } from "./users.middlewares";

const userRouter = Router();

// #router >> /register
userRouter.post("/register", registerUser);
// #end-router
// #router >> /login
userRouter.post("/login", loginUser);
// #end-router

export default userRouter;
