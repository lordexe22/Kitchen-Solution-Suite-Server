# Register Service

Responsable de registrar usuarios (local y Google), persistirlos en la BD y emitir el JWT + metadatos de cookie.

## Archivos
- `register.service.ts`: lógica principal.
- `types.ts`: tipos del servicio.
- `register.service.test.ts`: pruebas unitarias.

## Flujo
1) Validación de payload.
2) Verificación de no existencia.
3) Hash de contraseña (local) y creación de usuario.
4) Persistencia de token de plataforma (Google).
5) Emisión de JWT + datos de cookie.
