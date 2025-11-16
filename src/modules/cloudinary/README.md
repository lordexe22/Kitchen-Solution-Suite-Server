# 📦 Cloudinary Module

Módulo backend **100% agnóstico** para interactuar con Cloudinary. Sin dependencias de Express, Fastify u otro framework.

---

## ✨ Características

✅ CRUD completo de archivos (upload, delete, read, list)  
✅ Upload único y múltiple con control de concurrencia  
✅ Soporte para Buffer, Stream, y file paths  
✅ Organización en carpetas  
✅ Manejo de errores tipados  
✅ TypeScript con tipos estrictos  
✅ JSDoc completo en todas las funciones  
✅ Configuración desde variables de entorno  

---

## 📦 Instalación

### Dependencias necesarias:

```bash
npm install cloudinary
```

### Variables de entorno (.env):

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
CLOUDINARY_PRESET_NAME=tu-preset-opcional
```

---

## 🚀 Uso Básico

### 1. Subir un archivo

```typescript
import { uploadFile } from '@/modules/cloudinary';

// Desde path local
const result = await uploadFile('./photo.jpg', {
  folder: 'avatars',
  tags: ['user', 'profile']
});

console.log(result.secureUrl); // https://res.cloudinary.com/...

// Desde Buffer
const buffer = fs.readFileSync('./photo.jpg');
const result = await uploadFile(buffer, { folder: 'avatars' });

// Sobrescribir archivo existente
const result = await uploadFile('./photo.jpg', {
  folder: 'avatars',
  publicId: 'user123',
  overwrite: true
});
```

### 2. Subir múltiples archivos

```typescript
import { uploadMultiple } from '@/modules/cloudinary';

const files = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];

const result = await uploadMultiple(files, {
  folder: 'gallery',
  concurrency: 3 // Máximo 3 uploads simultáneos
});

console.log(`Exitosos: ${result.successCount}`);
console.log(`Fallidos: ${result.failureCount}`);

// Manejar fallos parciales
result.failed.forEach(({ source, error }) => {
  console.error(`Error en ${source}:`, error.message);
});
```

### 3. Eliminar un archivo

```typescript
import { deleteFile, NotFoundError } from '@/modules/cloudinary';

try {
  await deleteFile('avatars/user123');
  console.log('Archivo eliminado');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('El archivo no existe');
  }
}
```

### 4. Obtener información de un archivo

```typescript
import { getFileInfo } from '@/modules/cloudinary';

const info = await getFileInfo('avatars/user123');

console.log(info.secureUrl);
console.log(info.format);
console.log(info.bytes);
console.log(info.width, info.height);
```

### 5. Listar archivos de una carpeta

```typescript
import { listFiles } from '@/modules/cloudinary';

// Listar carpeta
const result = await listFiles({
  folder: 'avatars',
  maxResults: 20
});

console.log(`Total: ${result.totalCount}`);
result.resources.forEach(file => {
  console.log(file.publicId, file.secureUrl);
});

// Paginación
if (result.nextCursor) {
  const page2 = await listFiles({
    folder: 'avatars',
    nextCursor: result.nextCursor
  });
}
```

---

## 🗂️ Organización en Carpetas

```typescript
// Carpeta por defecto desde .env
await uploadFile('./photo.jpg'); // → uploads en raíz

// Carpeta específica
await uploadFile('./photo.jpg', { folder: 'avatars' });

// Carpeta anidada
await uploadFile('./photo.jpg', { folder: 'companies/grido/avatars' });

// Public ID custom + carpeta
await uploadFile('./photo.jpg', {
  folder: 'avatars',
  publicId: 'user-123-profile'
});
// Resultado: avatars/user-123-profile
```

---

## ❌ Manejo de Errores

```typescript
import {
  ValidationError,
  ConfigurationError,
  UploadError,
  NotFoundError,
  NetworkError
} from '@/modules/cloudinary';

try {
  await uploadFile('./photo.jpg');
} catch (error) {
  if (error instanceof ValidationError) {
    // Parámetros inválidos
  } else if (error instanceof ConfigurationError) {
    // Credenciales faltantes/inválidas
  } else if (error instanceof UploadError) {
    // Error en el upload
  } else if (error instanceof NotFoundError) {
    // Archivo no encontrado
  } else if (error instanceof NetworkError) {
    // Timeout o sin conexión
  }
}
```

---

## 🔧 Configuración Avanzada

### Override de configuración por llamada

```typescript
import { uploadFile, loadConfig } from '@/modules/cloudinary';

// Config custom solo para esta operación
const result = await uploadFile('./photo.jpg', {
  folder: 'temp',
  timeoutMs: 30000 // 30 segundos
});
```

---

## 📚 API Reference

### `uploadFile(source, options?)`
Sube un archivo.

**Parámetros:**
- `source`: `string | Buffer | Readable` - Archivo a subir
- `options`: `UploadOptions` - Opciones (opcional)

**Retorna:** `Promise<UploadResult>`

---

### `uploadMultiple(sources, options?)`
Sube múltiples archivos con concurrencia controlada.

**Parámetros:**
- `sources`: `UploadSource[]` - Array de archivos
- `options`: `UploadOptions & { concurrency?: number }` - Opciones

**Retorna:** `Promise<MultipleUploadResult>`

---

### `deleteFile(publicId, options?)`
Elimina un archivo.

**Parámetros:**
- `publicId`: `string` - Public ID del archivo
- `options`: `DeleteOptions` - Opciones (opcional)

**Retorna:** `Promise<DeleteResult>`

**Lanza:** `NotFoundError` si no existe

---

### `getFileInfo(publicId, options?)`
Obtiene información de un archivo.

**Parámetros:**
- `publicId`: `string` - Public ID del archivo
- `options`: `GetInfoOptions` - Opciones (opcional)

**Retorna:** `Promise<UploadResult>`

**Lanza:** `NotFoundError` si no existe

---

### `listFiles(options?)`
Lista archivos con filtros.

**Parámetros:**
- `options`: `ListOptions` - Filtros y paginación (opcional)

**Retorna:** `Promise<ListResult>`

---

## 🎯 Ejemplo con Express (Adapter)

```typescript
// routes/upload.routes.ts
import { Router } from 'express';
import { uploadFile } from '@/modules/cloudinary';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await uploadFile(req.file.buffer, {
      folder: 'uploads',
      tags: ['user-upload']
    });

    res.json({
      success: true,
      url: result.secureUrl,
      publicId: result.publicId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 📝 Notas

- El módulo cachea la configuración y el cliente de Cloudinary
- Las credenciales NUNCA se loggean (seguridad)
- Todos los errores son instancias de `CloudinaryError`
- El módulo es 100% reutilizable en cualquier proyecto Node.js

---

## 🔒 Seguridad

- ✅ Nunca expone credenciales en logs
- ✅ Valida todas las entradas
- ✅ Errores normalizados sin stacktraces del SDK
- ✅ Timeout configurable para evitar requests colgados

---

## 📄 Licencia

Parte del proyecto interno.