# Cloudinary Tests

Este directorio contiene los tests del modulo de Cloudinary.

## Archivos de test

| Archivo | Funcion testeada | Tests |
|---|---|---|
| create-image.test.ts | `createImage` | Validaciones, upload por URL/buffer/file, metadata, overwrite |
| delete-image.test.ts | `deleteImage` | Validaciones, eliminacion, errores del SDK |
| replace-image.test.ts | `replaceImage` | Validaciones, reemplazo de binario, metadata |
| rename-image.test.ts | `renameImage` | Validaciones, renombrado, conflictos |
| move-image.test.ts | `moveImage` | Validaciones, movimiento entre carpetas |
| change-image-prefix.test.ts | `changeImagePrefix` | Modos replace/append/prepend |
| get-image.test.ts | `getImage` | Validaciones, consulta, normalizacion |
| get-public-id-from-url.test.ts | `getPublicIdFromUrl` | URLs validas/invalidas, version, transformaciones, carpetas anidadas |
| list-images.test.ts | `listImages` | Paginacion, filtrado, recursividad |

## Alcance

- Tests unitarios con mocks del SDK.
- Tests de integracion que requieren credenciales reales.
- `getPublicIdFromUrl` es sincrona y no requiere mocks (solo parseo de URL).

## Notas

- Para integracion, define `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.
- Todos los tests se ejecutan por defecto.
- Total: 117 tests en 9 archivos.
