// src/config/environment.ts

/**
 * Validación y carga de variables de entorno críticas
 * Se ejecuta al inicio de la aplicación
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'GOOGLE_CLIENT_ID',
];

const OPTIONAL_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CLOUDINARY_ROOT_FOLDER',
];

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws Error si alguna variable requerida está faltando
 */
export function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  console.log(`✅ All required environment variables are configured`);
}

/**
 * Obtiene una variable de entorno con valor por defecto
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  
  return value || defaultValue || '';
}
