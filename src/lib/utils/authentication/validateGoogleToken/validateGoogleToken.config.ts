/* #info - Configuration for Google ID token validation */
// #section Imports
import dotenv from "dotenv";
import { GOOGLE_TOKEN_ISSUER } from "./validateGoogleToken.constants";
// #end-section
// #section config
dotenv.config();
// #end-section
// #const validateGoogleTokenConfig - Runtime configuration for validator
export const validateGoogleTokenConfig = {
  /** Google OAuth Client ID pulled from environment (GOOGLE_CLIENT_ID) */
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  /** Expected issuer for Google ID tokens */
  expectedIssuer: GOOGLE_TOKEN_ISSUER,
} as const;
// #end-const
