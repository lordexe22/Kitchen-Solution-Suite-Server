// src/modules/cloudinary/cloudinary.config.ts

import { v2 as cloudinary } from 'cloudinary';
import type { CloudinaryConfig } from './cloudinary.types';
import { ConfigurationError } from './cloudinary.errors';

/**
 * Configuración por defecto del módulo.
 */
const DEFAULT_CONFIG: Partial<CloudinaryConfig> = {
  secure: true,
  timeoutMs: 60000,
  maxConcurrency: 3,
};

/**
 * Cliente de Cloudinary cacheado (singleton).
 */
let cachedClient: typeof cloudinary | null = null;

/**
 * Configuración cargada y cacheada.
 */
let cachedConfig: CloudinaryConfig | null = null;

// #region Load Configuration

/**
 * Carga y valida la configuración desde variables de entorno.
 * Permite override parcial de configuración.
 * 
 * @param overrides - Valores a sobrescribir de la config por defecto
 * @returns Configuración validada y completa
 * @throws {ConfigurationError} Si faltan credenciales requeridas
 * 
 * @example
 * const config = loadConfig();
 * const customConfig = loadConfig({ folder: 'uploads/custom' });
 */
export function loadConfig(
  overrides?: Partial<CloudinaryConfig>
): CloudinaryConfig {
  // Si ya hay config cacheada y no hay overrides, retornarla
  if (cachedConfig && !overrides) {
    return cachedConfig;
  }

  // Leer desde environment variables
  const envConfig: Partial<CloudinaryConfig> = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.CLOUDINARY_PRESET_NAME,
  };

  // Merge: defaults < env < overrides
  const config: CloudinaryConfig = {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...overrides,
  } as CloudinaryConfig;

  // Validar credenciales requeridas
  validateConfig(config);

  // Cachear solo si no hay overrides
  if (!overrides) {
    cachedConfig = config;
  }

  return config;
}

// #endregion

// #region Validate Configuration

/**
 * Valida que la configuración tenga todos los campos requeridos.
 * 
 * @param config - Configuración a validar
 * @throws {ConfigurationError} Si falta algún campo requerido
 */
function validateConfig(config: CloudinaryConfig): void {
  const required: Array<keyof CloudinaryConfig> = [
    'cloudName',
    'apiKey',
    'apiSecret',
  ];

  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required Cloudinary configuration: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

// #endregion

// #region Get Cloudinary Client

/**
 * Obtiene el cliente de Cloudinary configurado.
 * Usa lazy loading y cachea la instancia.
 * 
 * @param overrides - Configuración custom para esta instancia
 * @returns Cliente de Cloudinary configurado
 * 
 * @example
 * const client = getCloudinaryClient();
 * const result = await client.uploader.upload(file);
 */
export function getCloudinaryClient(
  overrides?: Partial<CloudinaryConfig>
): typeof cloudinary {
  // Si hay overrides, crear cliente temporal sin cachear
  if (overrides) {
    const config = loadConfig(overrides);
    const tempClient = cloudinary;
    tempClient.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: config.secure,
    });
    return tempClient;
  }

  // Si ya hay cliente cacheado, retornarlo
  if (cachedClient) {
    return cachedClient;
  }

  // Crear y cachear cliente
  const config = loadConfig();
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: config.secure,
  });

  cachedClient = cloudinary;
  return cachedClient;
}

// #endregion

// #region Reset Cache (para tests)

/**
 * Resetea el cache de configuración y cliente.
 * Útil para tests o reconfiguración en runtime.
 * 
 * @internal
 */
export function resetCache(): void {
  cachedClient = null;
  cachedConfig = null;
}

// #endregion