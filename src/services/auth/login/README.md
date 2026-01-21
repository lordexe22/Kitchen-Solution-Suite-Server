# Login Service

Responsable de autenticar usuarios (local y Google), validar credenciales y emitir el JWT + metadatos de cookie.

## Archivos
- `login.service.ts`: lógica principal.
- `types.ts`: tipos del servicio.
- `login.service.test.ts`: pruebas unitarias.

## Flujo
1) Validación de payload.
2) Autenticación (local o Google).
3) Mapeo de usuario a DTO.
4) Emisión de JWT + datos de cookie.
