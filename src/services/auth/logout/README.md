# Logout Service

Responsable de preparar la limpieza de la cookie JWT para cerrar sesión.

## Archivos
- `logout.service.ts`: lógica principal.
- `types.ts`: tipos del servicio.

## Flujo
1) Preparar clear-cookie.
2) Retornar metadatos para que el middleware aplique la limpieza.
