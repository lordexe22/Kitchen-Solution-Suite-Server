// cloudinary.config.ts
/* #info - Cloudinary configuration utilities */
// #section Imports
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigurationError } from './cloudinary.errors';
// #end-section

let cachedClient: typeof cloudinary | null = null;
let cachedConfigKey: string | null = null;
// #function getCloudinaryClient - Obtiene una instancia configurada del cliente de Cloudinary
/**
 * Obtiene una instancia configurada del cliente de Cloudinary.
 * @returns Cliente de Cloudinary configurado
 * @throws ConfigurationError si faltan credenciales
 * @version 1.0.0
 */
export const getCloudinaryClient = (): typeof cloudinary => {
	// #step 1 - Leer credenciales desde variables de entorno
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;
	// #end-step

	// #step 2 - Validar credenciales
	if (!cloudName || !apiKey || !apiSecret) {
		throw new ConfigurationError(
			'Faltan credenciales de Cloudinary. Verifica CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
		);
	}
	// #end-step

	const configKey = `${cloudName}:${apiKey}:${apiSecret}`;
	if (cachedClient && cachedConfigKey === configKey) {
		return cachedClient;
	}

	// #step 3 - Configurar SDK
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	});
	// #end-step

	// #step 4 - Retornar cliente configurado
	cachedClient = cloudinary;
	cachedConfigKey = configKey;
	return cloudinary;
	// #end-step
};
// #end-function