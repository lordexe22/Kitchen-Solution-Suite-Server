// src\modules\businesses\businesses.routes.ts

import { Router, Request, Response } from "express";
import { requireAuth } from "../auth/auth.middlewares";
import { 
  createBusiness, 
  getMyBusinesses,
  updateBusinessSocials 
} from "./businesses.middlewares";

const router = Router();

router.post("/create", requireAuth, createBusiness);

router.get("/mine", requireAuth, getMyBusinesses);

router.put("/:id/socials", requireAuth, updateBusinessSocials);

export default router;
