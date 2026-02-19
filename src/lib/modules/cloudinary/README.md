# Cloudinary

Modulo wrapper sobre Cloudinary SDK v2 para gestion integral de imagenes en la nube.

## Overview

Este modulo expone una interfaz tipada para crear, reemplazar, eliminar, mover, renombrar y listar imagenes. Normaliza respuestas del SDK, valida entradas criticas y estandariza el manejo de errores.

Arquitectura basica:

```
cloudinary/
├── cloudinary.ts              # Funciones principales del modulo
├── cloudinary.config.ts       # Configuracion y cliente de Cloudinary
├── cloudinary.types.ts        # Definiciones de tipos TypeScript
├── cloudinary.utils.ts        # Utilidades y helpers internos
├── cloudinary.errors.ts       # Clases de error especificas
├── docs/                      # Documentacion
│   └── plantuml-test.puml      # Diagrama PlantUML
└── test/                      # Tests del modulo
    ├── create-image.test.ts
    ├── delete-image.test.ts
    ├── replace-image.test.ts
    ├── rename-image.test.ts
    ├── move-image.test.ts
    ├── change-image-prefix.test.ts
    ├── get-image.test.ts
    ├── get-public-id-from-url.test.ts
    ├── is-image-buffer.test.ts
    └── list-images.test.ts
```

## Installation

Uso interno del repo. Importar desde el entrypoint del modulo:

```typescript
import { createImage } from './cloudinary';
```

## Configuration

Variables requeridas:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

El cliente se configura en cloudinary.config.ts con credenciales de entorno.

## Core Concepts

- Fuente de verdad por operacion: se consulta el recurso antes de renombrar o mover.
- Validacion consistente: entradas criticas se validan antes de la llamada al SDK.
- Errores tipados por operacion.
- Normalizacion consistente de respuestas.
- Metadata consistente: cuando falta, se retorna {}.

## API Reference

- createImage(image, options, metadata): CreateImageResponse - Sube una imagen.
- deleteImage(publicId): DeleteImageResponse - Elimina una imagen.
- replaceImage(params): ReplaceImageResponse - Reemplaza binario manteniendo publicId.
- renameImage(params): GetImageResult - Renombra imagen sin reupload.
- moveImage(params): GetImageResult - Mueve imagen a otra carpeta.
- changeImagePrefix(params): GetImageResult - Ajusta prefijos con modos replace/append/prepend.
- getImage(publicId): GetImageResult - Obtiene datos completos de una imagen.
- getPublicIdFromUrl(url): GetPublicIdFromUrlResult - Extrae publicId, folder, fileName y format de una URL de Cloudinary.
- isImageBuffer(buffer): boolean - Detecta si un buffer es una imagen soportada (JPEG, PNG, GIF, WebP, BMP, ICO, TIFF, SVG).
- listImages(params): ListImagesResult - Lista imagenes con paginacion.

## Examples

```typescript
import { createImage } from './cloudinary';

const result = await createImage(
  { type: 'url', url: 'https://example.com/image.jpg' },
  { name: 'profile', folder: 'users', prefix: 'avatar' },
  { source: 'upload', userId: '123' }
);
```

```typescript
import { getPublicIdFromUrl } from './cloudinary';

const info = getPublicIdFromUrl(
  'https://res.cloudinary.com/demo/image/upload/v1234567890/companies/acme/logo.webp'
);
// => { publicId: 'companies/acme/logo', folder: 'companies/acme', fileName: 'logo', format: 'webp' }
```

```typescript
import { listImages } from './cloudinary';

const result = await listImages({
  folder: 'products',
  recursive: true,
  limit: 50,
});
```

```typescript
import { changeImagePrefix } from './cloudinary';

await changeImagePrefix({
  publicId: 'users/user--admin-profile',
  prefix: 'company',
  mode: 'replace',
});
```

## Error Handling

Errores expuestos:
- ValidationError
- ConfigurationError
- UploadError
- DeleteError
- NotFoundError
- ReplaceImageError
- RenameImageError
- MoveImageError
- FetchImageError

## Best Practices

- Validar entradas antes de llamar al SDK.
- Usar el index.ts como unico entrypoint publico.
- Mantener metadatos consistentes y tipados.
- Agregar tests unitarios y documentar integracion.

## Changelog

### v1.2.0
- Agregada funcion `isImageBuffer` para detectar formatos de imagen via magic bytes.
- Soporta JPEG, PNG, GIF, WebP, BMP, ICO, TIFF y SVG.
- Util para fail-fast antes de upload, evitando latencia de red con formatos invalidos.

### v1.1.0
- Agregada funcion `getPublicIdFromUrl` para extraer publicId desde URLs de Cloudinary.
- Agregado tipo `GetPublicIdFromUrlResult`.
- Agregada utilidad interna `_extractPublicIdFromCloudinaryUrl`.
- Soporte para URLs con version, transformaciones y carpetas anidadas.

### v1.0.0
- Version inicial del modulo Cloudinary.

## See Also

- [docs/plantuml-test.puml](docs/plantuml-test.puml)
- [test/README.md](test/README.md)
