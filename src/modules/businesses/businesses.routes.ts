// src\modules\businesses\businesses.routes.ts

import { Router, Request, Response } from "express";
import { requireAuth } from "../auth/auth.middlewares";
import { createBusiness, getMyBusinesses } from "./businesses.middlewares";

const router = Router();

router.post("/create", requireAuth, createBusiness);

router.get("/mine", requireAuth, getMyBusinesses);

export default router;
