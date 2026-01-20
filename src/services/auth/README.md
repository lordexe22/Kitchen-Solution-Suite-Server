# Servicios de Autenticación

Este directorio contiene los servicios de autenticación del sistema, responsables de gestionar el login y registro de usuarios mediante credenciales locales o Google OAuth.

---

## 📋 Índice

- [Arquitectura](#arquitectura)
- [Servicios Disponibles](#servicios-disponibles)
- [Módulos y Utilidades](#módulos-y-utilidades)
- [Tipos de Datos](#tipos-de-datos)
- [Testing](#testing)
- [Flujos de Autenticación](#flujos-de-autenticación)

---

## 🏗️ Arquitectura

Los servicios de autenticación siguen el patrón **Service Layer**, donde:

1. **Servicios** (`*.service.ts`): Contienen la lógica de negocio pura, independiente de Express
2. **Middlewares** (`middlewares/auth.middlewares.ts`): Orquestan los servicios y manejan HTTP (req/res/cookies)
3. **Rutas** (`routes/auth.routes.ts`): Definen los endpoints y llaman a los middlewares maestros

### Flujo de Request

```
Cliente
  ↓
POST /login → authRouter
  ↓
loginMiddleware (Express)
  ↓
loginService (lógica pura)
  ├─ validatePayload
  ├─ authenticateUser
  │  ├─ authenticateLocalUser (email/password)
  │  └─ authenticateGoogleUser (Google OAuth)
  └─ createJWT
  ↓
loginMiddleware retorna respuesta HTTP
  ↓
Cliente recibe { user, JWT cookie }
```

---

## 📦 Servicios Disponibles

### 1. `login.service.ts`

**Responsabilidad:** Autenticar usuarios existentes mediante credenciales locales o Google OAuth.

**Función principal:**
```typescript
loginService(payload: LoginPayload): Promise<LoginResult>
```

**Entrada (`LoginPayload`):**
```typescript
{
  platformName: 'local' | 'google',
  
  // Para local:
  email?: string,
  password?: string,
  
  // Para Google:
  credential?: string  // Token JWT de Google
}
```

**Salida (`LoginResult`):**
```typescript
{
  user: {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    imageUrl: string | null,
    type: 'admin' | 'employee' | 'guest' | 'dev',
    branchId: number | null,
    state: 'pending' | 'active' | 'suspended'
  },
  token: string  // JWT de sesión
}
```

**Excepciones:**
- `'Invalid email or password'` - Credenciales locales incorrectas
- `'Invalid Google token or user not registered'` - Token de Google inválido o usuario no existe
- `'User account is suspended'` - Usuario suspendido (solo Google)
- `'Missing platform in body'` - Falta especificar plataforma
- `'Missing email or password'` - Faltan credenciales locales
- `'Missing Google credential'` - Falta token de Google

---

### 2. `register.service.ts`

**Responsabilidad:** Registrar nuevos usuarios mediante credenciales locales o Google OAuth.

**Función principal:**
```typescript
registerService(payload: RegisterPayload): Promise<RegisterResult>
```

**Entrada (`RegisterPayload`):**
```typescript
{
  platformName: 'local' | 'google',
  firstName: string,
  lastName: string,
  email: string,
  
  // Para local:
  password?: string | null,
  
  // Para Google:
  platformToken?: string | null,  // Google User ID (sub)
  credential?: string | null,     // Token JWT de Google
  
  // Opcional:
  imageUrl?: string | null
}
```

**Salida (`RegisterResult`):**
```typescript
{
  user: UserData,  // Mismo formato que loginService
  token: string    // JWT de sesión
}
```

**Excepciones:**
- `'User already exists'` - Email ya registrado
- `'Invalid platform'` - Plataforma no soportada
- `'Missing required fields'` - Faltan firstName, lastName o email
- `'Password required for local registration'` - Falta password para registro local
- `'Platform token required for Google registration'` - Falta platformToken para Google

---

## 🧩 Módulos y Utilidades

### Módulos Externos Utilizados

#### 1. **validateGoogleToken** (`lib/utils/authentication/validateGoogleToken/`)
- **Responsabilidad:** Validar la firma JWT de tokens de Google OAuth
- **Entrada:** Token JWT string
- **Salida:** GooglePayload validado con claims (sub, email, name, picture, etc.)
- **Usado en:** `authenticateGoogleUser()` dentro de `login.service.ts`

#### 2. **jwtCookieManager** (`lib/modules/jwtCookieManager/`)
- **Función:** `createJWT({ userId: number })`
- **Responsabilidad:** Generar tokens JWT para sesiones de usuario
- **Usado en:** Ambos servicios (login y register) en el paso final

#### 3. **password.utils** (`utils/password.utils.ts`)
- **Funciones:**
  - `hashPassword(password: string): Promise<string>` - Hashea contraseña con bcrypt
  - `comparePassword(plain: string, hash: string): Promise<boolean>` - Verifica contraseña
- **Usado en:** 
  - `register.service.ts` - hashea contraseña antes de guardar
  - `login.service.ts` - verifica contraseña en autenticación local

### Base de Datos

#### Tablas Utilizadas

**`users`** (tabla principal):
```sql
{
  id: serial PRIMARY KEY,
  firstName: varchar(255) NOT NULL,
  lastName: varchar(255) NOT NULL,
  email: varchar(255) UNIQUE NOT NULL,
  passwordHash: text NOT NULL,
  type: user_type NOT NULL DEFAULT 'guest',
  branchId: integer NULLABLE,
  createdAt: timestamp NOT NULL DEFAULT NOW(),
  updatedAt: timestamp NOT NULL DEFAULT NOW(),
  isActive: boolean NOT NULL DEFAULT false,
  state: user_state NOT NULL DEFAULT 'pending',
  imageUrl: text NULLABLE
}
```

**`api_platforms`** (vinculación con OAuth):
```sql
{
  userId: serial NOT NULL REFERENCES users(id),
  platformName: platform_name NOT NULL,
  platformToken: text NOT NULL,
  linkedAt: timestamp NOT NULL DEFAULT NOW()
}
```

---

## 📊 Tipos de Datos

### UserData (Salida estándar de ambos servicios)

```typescript
interface UserData {
  id: number;                    // ID único del usuario
  email: string;                 // Email normalizado (lowercase)
  firstName: string;             // Nombre
  lastName: string;              // Apellido
  imageUrl: string | null;       // URL de avatar (null si no tiene)
  type: 'admin' | 'employee' | 'guest' | 'dev';  // Tipo de usuario
  branchId: number | null;       // ID de sucursal (solo para employees)
  state: 'pending' | 'active' | 'suspended';     // Estado del usuario
}
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests de autenticación
npm test src/services/auth/

# Solo login
npm test src/services/auth/login.service.test.ts

# Solo register
npm test src/services/auth/register.service.test.ts

# Con cobertura
npm test -- --coverage src/services/auth/
```

### Cobertura de Tests

#### `login.service.test.ts`
- ✅ Validación de payloads (platformName, email, password, credential)
- ✅ Login local exitoso
- ✅ Login local con credenciales inválidas
- ✅ Normalización de email (lowercase, trim)
- ✅ Usuario suspendido
- ⚠️ Login Google (limitado - requiere mockear validateGoogleToken)

#### `register.service.test.ts`
- ✅ Validación de payloads completa
- ✅ Registro local exitoso
- ✅ Registro Google exitoso
- ✅ Usuario duplicado (email ya existe)
- ✅ Normalización de datos (email, trim)
- ✅ Creación de registros en `api_platforms`
- ✅ Campos opcionales (imageUrl)

### Limitaciones Actuales

- **Google OAuth:** Los tests de Google login son limitados porque `validateGoogleToken` requiere tokens reales de Google. En producción, debería mockearse este módulo.
- **Estado suspendido:** La validación de usuario suspendido solo está implementada para Google login, no para local.

---

## 🔄 Flujos de Autenticación

### Flujo de Login Local

```
1. Cliente envía { platformName: 'local', email, password }
   ↓
2. Validar payload (campos requeridos)
   ↓
3. Buscar usuario en BD por email
   ↓
4. Comparar password hasheado
   ↓
5. Obtener datos del usuario
   ↓
6. Generar JWT
   ↓
7. Retornar { user, token }
```

### Flujo de Login Google

```
1. Cliente envía { platformName: 'google', credential }
   ↓
2. Validar payload
   ↓
3. Validar firma del token JWT con Google OAuth2
   ↓
4. Extraer 'sub' (Google User ID) del token validado
   ↓
5. Buscar en api_platforms por platformToken = sub
   ↓
6. Obtener userId de la vinculación
   ↓
7. Buscar datos completos del usuario
   ↓
8. Validar que no esté suspendido
   ↓
9. Generar JWT
   ↓
10. Retornar { user, token }
```

### Flujo de Registro Local

```
1. Cliente envía { platformName: 'local', firstName, lastName, email, password }
   ↓
2. Validar payload
   ↓
3. Verificar que el email no exista
   ↓
4. Hashear password con bcrypt
   ↓
5. Insertar usuario en BD (state: 'pending', type: 'guest')
   ↓
6. Obtener datos del usuario creado
   ↓
7. Generar JWT
   ↓
8. Retornar { user, token }
```

### Flujo de Registro Google

```
1. Cliente envía { platformName: 'google', firstName, lastName, email, platformToken }
   ↓
2. Validar payload
   ↓
3. Verificar que el email no exista
   ↓
4. Insertar usuario en BD (passwordHash vacío, state: 'pending')
   ↓
5. Insertar vinculación en api_platforms
   ↓
6. Obtener datos del usuario creado
   ↓
7. Generar JWT
   ↓
8. Retornar { user, token }
```

---

## 📌 Notas Importantes

### Seguridad

- ✅ Las contraseñas se hashean con bcrypt antes de guardar
- ✅ Los tokens de Google se validan contra la API de Google OAuth2
- ✅ Los emails se normalizan (lowercase) para evitar duplicados
- ✅ Los JWT se generan con secreto seguro configurado en `.env`
- ⚠️ La validación de usuario suspendido solo aplica a Google login

### Normalización de Datos

- **Email:** Siempre se convierte a lowercase y se hace trim
- **Nombres:** Se hace trim para eliminar espacios
- **ImageUrl:** Se establece como `null` si no se provee

### Estados de Usuario

- **`pending`**: Usuario recién registrado, email no verificado
- **`active`**: Usuario con email verificado y cuenta activa
- **`suspended`**: Usuario suspendido temporalmente (no puede login con Google)

### Tipos de Usuario

- **`guest`**: Usuario normal sin permisos especiales (default en registro)
- **`employee`**: Empleado asignado a una sucursal con permisos específicos
- **`admin`**: Propietario de compañía con control total
- **`dev`**: Usuario desarrollador con acceso especial

---

## 🔗 Enlaces Relacionados

- **Middlewares:** `src/middlewares/auth.middlewares.ts`
- **Rutas:** `src/routes/auth.routes.ts`
- **Schema BD:** `src/db/schema.ts`
- **Módulo Google OAuth:** `src/lib/utils/authentication/validateGoogleToken/`
- **JWT Manager:** `src/lib/modules/jwtCookieManager/`
