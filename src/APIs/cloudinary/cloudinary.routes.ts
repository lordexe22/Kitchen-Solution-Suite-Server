// src/APIs/cloudinary/cloudinary.routes.ts
import { Router } from "express";
import { generateSignatureMiddleware } from "./cloudinary.middlewares";
import { validateJWTAndGetPayload } from "../../modules/auth/auth.middlewares";

const cloudinaryRouter = Router();

cloudinaryRouter.get("/signature", validateJWTAndGetPayload, generateSignatureMiddleware);

export default cloudinaryRouter;
