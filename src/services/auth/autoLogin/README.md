# AutoLogin Service

Responsable de validar el JWT de la cookie, verificar estado del usuario y refrescar el token/cookie.

## Archivos
- `autoLogin.service.ts`: lógica principal.
- `types.ts`: tipos del servicio.

## Flujo
1) Extraer JWT de cookie.
2) Validar/decodificar token.
3) Consultar usuario y estado.
4) Refrescar JWT + datos de cookie.
