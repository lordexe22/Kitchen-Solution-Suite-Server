import cloudinary from "./cloudinary.config";
import crypto from "crypto";

export const generateSignature = () => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const upload_preset = process.env.CLOUDINARY_PRESET_NAME || "";

  // Construir el string para firmar, con parámetros ordenados y separados por &
  const paramsToSign = `timestamp=${timestamp}&upload_preset=${upload_preset}`;

  console.log("API Secret usado para firma:", cloudinary.config());
  console.log("API Secret usado para firma:", cloudinary.config().api_secret);

  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + cloudinary.config().api_secret)
    .digest("hex");

  return {
    timestamp,
    signature,
  };
};
