// src\modules\businesses\businesses.routes.ts

import { Router } from "express";
import { requireAuth } from "../auth/auth.middlewares";
import { 
  createBusiness, 
  getMyBusinesses,
  updateBusinessSocials,
  getBusinessSocials
} from "./businesses.middlewares";

const router = Router();

router.post("/create", requireAuth, createBusiness);

router.get("/mine", requireAuth, getMyBusinesses);

router.put("/:id/socials", requireAuth, updateBusinessSocials);

router.get("/:id/socials", requireAuth, getBusinessSocials);

export default router;
