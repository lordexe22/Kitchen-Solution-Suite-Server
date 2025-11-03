// src/APIs/cloudinary/cloudinary.middlewares.ts
import { Response } from "express";
import { generateSignature } from "./cloudinary.utils";
import { AuthenticatedRequest } from "../../modules/jwtManager/jwtManager.types";
import { env } from "process";

export const generateSignatureMiddleware = (req: AuthenticatedRequest, res: Response) => {
  try {
    const signatureData = generateSignature();
    const responseObjet = {
      ...signatureData, // timestamp and signature
      presetName: env.CLOUDINARY_PRESET_NAME || "",
      apiKey: env.CLOUDINARY_API_KEY || "",
      cloudName: env.CLOUDINARY_CLOUD_NAME || ""
    }
    res.status(200).json(responseObjet);
  } catch (error) {
    res.status(500).json({ error: "Error al generar la firma" });
  }
};
