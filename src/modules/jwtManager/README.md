# 🔐 JWT Manager Module

Módulo completo para gestión de autenticación mediante JSON Web Tokens (JWT) en aplicaciones Express + TypeScript.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso Básico](#-uso-básico)
- [API Reference](#-api-reference)
  - [Utilidades](#utilidades)
  - [Middlewares](#middlewares)
  - [Rutas](#rutas)
- [Ejemplos](#-ejemplos)
- [Seguridad](#-seguridad)
- [Testing](#-testing)

---

## ✨ Características

✅ Generación y verificación de tokens JWT  
✅ Almacenamiento seguro en cookies HTTP-only  
✅ Middlewares de autenticación (obligatoria y opcional)  
✅ Rutas para refresh y logout  
✅ Manejo de errores robusto  
✅ TypeScript con tipos completos  
✅ JSDoc detallado en todas las funciones  
✅ Testing incluido  

---

## 📦 Instalación

### Dependencias necesarias:
```bash
npm install jsonwebtoken cookie-parser
npm install --save-dev @types/jsonwebtoken @types/cookie-parser
```

### Estructura del módulo:
```
src/modules/jwtManager/
├── index.ts                    # Exportaciones centralizadas
├── jwtManager.config.ts        # Configuración (SECRET, cookies)
├── jwtManager.types.ts         # Tipos TypeScript
├── jwtManager.utils.ts         # Utilidades (sign, verify, cookies)
├── jwtManager.middlewares.ts   # Middlewares de autenticación
├── jwtManager.routes.ts        # Rutas (/refresh, /logout)
├── jwtManager.test.ts          # Tests unitarios
└── README.md                   # Este archivo
```

---

## ⚙️ Configuración

### 1. Variables de entorno (.env):
```env
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria_aqui
NODE_ENV=development  # o 'production' para activar HTTPS
```

⚠️ **Importante:** `JWT_SECRET` debe ser una cadena larga, aleatoria y secreta.

### 2. Configurar cookie-parser en el servidor:
```typescript
// src/server.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { jwtManagerRoutes } from './modules/jwtManager';

const app = express();

app.use(cookieParser()); // ⬅️ Necesario para leer cookies
app.use('/api/jwt', jwtManagerRoutes); // ⬅️ Registrar rutas del módulo
```

---

## 🚀 Uso Básico

### Generar un token en login:
```typescript
import { signJWT, setJWTCookie } from './modules/jwtManager';

export const loginHandler = (req: Request, res: Response) => {
  const user = authenticateUser(req.body); // Tu lógica de autenticación
  
  const token = signJWT({ userId: user.id });
  setJWTCookie(res, token);
  
  res.json({ success: true, user });
};
```

### Proteger rutas con middleware:
```typescript
import { Router } from 'express';
import { authenticateJWT } from './modules/jwtManager';

const router = Router();

router.get('/protected', authenticateJWT, (req, res) => {
  const userId = req.user!.userId; // Garantizado por el middleware
  res.json({ message: `Hello user ${userId}` });
});
```

### Autenticación opcional:
```typescript
import { optionalAuth } from './modules/jwtManager';

router.get('/public', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: `Welcome back, ${req.user.userId}` });
  } else {
    res.json({ message: 'Welcome, guest' });
  }
});
```

---

## 📚 API Reference

### Utilidades

#### `signJWT(payload, expiresIn?)`

Genera un token JWT firmado.
```typescript
const token = signJWT({ userId: 123 }, '7d');
```

**Parámetros:**
- `payload: JWTPayload` - Datos a incluir (userId obligatorio)
- `expiresIn?: JWTExpiration` - Tiempo de expiración (default: '30d')

**Retorna:** `string` - Token JWT

---

#### `verifyJWT(token)`

Verifica y decodifica un token.
```typescript
try {
  const payload = verifyJWT(token);
  console.log(payload.userId);
} catch (error) {
  console.error('Token inválido');
}
```

**Parámetros:**
- `token: string` - Token a verificar

**Retorna:** `JWTPayload` - Datos decodificados

**Lanza:** `Error` si el token es inválido o expiró

---

#### `isTokenValid(token)`

Verifica validez sin lanzar excepciones.
```typescript
if (isTokenValid(token)) {
  // Token válido
}
```

---

#### `setJWTCookie(res, token)`

Guarda token en cookie HTTP-only.
```typescript
setJWTCookie(res, token);
```

---

#### `clearJWTCookie(res)`

Elimina cookie de autenticación.
```typescript
clearJWTCookie(res);
```

---

#### `getJWTFromCookie(req)`

Extrae token desde cookie.
```typescript
const token = getJWTFromCookie(req);
```

---

#### `getTokenFromHeader(authorization)`

Extrae token desde header `Authorization: Bearer <token>`.
```typescript
const token = getTokenFromHeader(req.headers.authorization);
```

---

### Middlewares

#### `authenticateJWT`

Middleware de autenticación **obligatoria**.
```typescript
router.get('/private', authenticateJWT, handler);
```

**Comportamiento:**
- ✅ Token válido → continúa, `req.user` contiene el payload
- ❌ Sin token o inválido → retorna 401 Unauthorized

---

#### `optionalAuth`

Middleware de autenticación **opcional**.
```typescript
router.get('/public', optionalAuth, handler);
```

**Comportamiento:**
- ✅ Token válido → `req.user` contiene el payload
- ⚠️ Sin token/inválido → `req.user = undefined`, pero continúa

---

#### `validateJWTAndGetPayload`

Alias de `authenticateJWT` con nombre más descriptivo.
```typescript
router.post('/companies/create', validateJWTAndGetPayload, createCompany);
```

---

### Rutas

#### `POST /refresh`

Refresca un token expirado.

**Request:**
```bash
curl -X POST http://localhost:4000/api/jwt/refresh \
  --cookie "auth_token=<token_antiguo>"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

---

#### `POST /logout`

Cierra sesión y elimina cookie.

**Request:**
```bash
curl -X POST http://localhost:4000/api/jwt/logout \
  --cookie "auth_token=<token>"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 💡 Ejemplos

### Ejemplo completo de login:
```typescript
import { signJWT, setJWTCookie } from './modules/jwtManager';
import { comparePassword } from './utils/password.utils';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Buscar usuario en DB
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verificar contraseña
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generar token y guardarlo en cookie
  const token = signJWT({ userId: user.id, email: user.email });
  setJWTCookie(res, token);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
};
```

### Ejemplo de ruta protegida:
```typescript
import { authenticateJWT, AuthenticatedRequest } from './modules/jwtManager';

router.get('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  
  const user = await getUserById(userId);
  
  res.json({
    success: true,
    profile: user
  });
});
```

---

## 🔒 Seguridad

### Mejores prácticas implementadas:

✅ **Cookies HTTP-only** - No accesibles desde JavaScript del cliente  
✅ **SameSite: lax** - Protección contra CSRF  
✅ **Secure en producción** - Solo HTTPS en entornos productivos  
✅ **Tokens con expiración** - Máximo 30 días por defecto  
✅ **Secret desde .env** - No hardcodeado en el código  

### Recomendaciones adicionales:

1. **Rotar el JWT_SECRET regularmente** en producción
2. **Usar HTTPS** siempre en producción
3. **Implementar rate limiting** en rutas de autenticación
4. **Guardar tokens revocados** en una blacklist (Redis)
5. **Refrescar tokens** antes de que expiren con `/refresh`

---

## 🧪 Testing

Para ejecutar los tests:
```bash
npm test -- jwtManager.test.ts
```

Ver archivo `jwtManager.test.ts` para ejemplos de testing.

---

## 📄 Licencia

Este módulo es parte del proyecto interno y sigue la misma licencia.

---

## 🤝 Contribuciones

Para agregar funcionalidades o corregir bugs:
1. Crear una rama desde `main`
2. Agregar tests para nuevas funcionalidades
3. Actualizar este README si es necesario
4. Crear un Pull Request

---

## 📞 Soporte

Para dudas o problemas, contactar al equipo de desarrollo.