// src\middlewares\auth\auth.middlewares.ts
// #section Imports
import { Request, Response, NextFunction } from "express";
import { validateAndProcessName, validateAndProcessEmail, validatePassword } from "../../utils/authenticationValidations.utils";
import { hashPassword, comparePassword } from "../../utils/password.utils";
import { db } from "../../db/init";
import { branchesTable, employeePermissionsTable, usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { signJWT, setJWTCookie } from "../../modules/jwtManager";
import { DEFAULT_EMPLOYEE_PERMISSIONS } from "../../config/permissions.config";
import { dbPermissionsToAppFormat } from "../../services/employees/permissions.utils";
// #end-section
// #middleware validateRegisterPayload
/**
 * Middleware: validateRegisterPayload
 * Valida y normaliza los datos recibidos en el registro según la plataforma.
 * Si es válido, reemplaza los valores procesados en req.body.
 */
export const validateRegisterPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.log('validateRegisterPayload');
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ 
        success: false,
        error: "Invalid request body" 
      });
    }

    if (!data.platformName) {
      return res.status(400).json({ 
        success: false,
        error: "Missing field platform in body" 
      });
    }

    if (data.platformName === "local") {
      const { firstName, lastName, email, password } = data;

      // Validaciones básicas de presencia
      if (!firstName || !lastName || !email || !password ) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields" 
        });
      }

      // Validaciones reutilizando las utilidades del frontend
      const processedName = validateAndProcessName(firstName);
      const processedLastName = validateAndProcessName(lastName);
      const processedEmail = validateAndProcessEmail(email);
      validatePassword(password);

      // Reasignar datos normalizados
      req.body = {
        platformName: "local",
        firstName: processedName,
        lastName: processedLastName,
        email: processedEmail,
        password,
        // preservar datos de invitación si existen en res.locals
        invitationToken: (req.res?.locals as any)?.invitationToken,
        invitationData: (req.res?.locals as any)?.invitationData,
      };

      return next();
    }

    if (data.platformName === "google") {
      const { firstName, lastName, email, platformToken, imageUrl } = data;

      if (!firstName || !lastName || !email || !platformToken) {
        return res.status(400).json({ 
          success: false,
          error: "Missing required fields" 
        });
      }

      const processedName = validateAndProcessName(firstName);
      const processedLastName = validateAndProcessName(lastName);
      const processedEmail = validateAndProcessEmail(email);

      req.body = {
        platformName: "google",
        firstName: processedName,
        lastName: processedLastName,
        email: processedEmail,
        platformToken,
        imageUrl: imageUrl?.trim() || null,
        invitationToken: (req.res?.locals as any)?.invitationToken,
        invitationData: (req.res?.locals as any)?.invitationData,
      };

      return next();
    }

    return res.status(400).json({ 
      success: false,
      error: "Invalid platform value" 
    });

  } catch (err) {
    return res.status(400).json({ 
      success: false,
      error: (err as Error).message 
    });
  }
};
// #end-middleware
// #middleware hashPasswordMiddleware 
/**
 * Middleware: hashPasswordMiddleware
 * 
 * Genera y adjunta el hash de la contraseña del usuario si la plataforma es local.
 * 
 * Flujo:
 * 1. Verifica que el registro provenga de la plataforma "local".
 * 2. Hashea la contraseña recibida en req.body.password.
 * 3. Sustituye el campo "password" por "passwordHash" en req.body.
 * 
 * Errores:
 * - Si falta la contraseña, responde con 400.
 * - Si ocurre un error interno al generar el hash, responde con 500.
 */
export const hashPasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('hashPasswordMiddleware');
  try {
    const { platformName, password } = req.body;

    if (platformName !== 'local') {
      return next();
    }

    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Missing or invalid password' });
      return;
    }

    const passwordHash = await hashPassword(password);
    req.body.passwordHash = passwordHash;
    delete req.body.password;

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error hashing password' });
  }
};
// #end-middleware
// #middleware addNewUserDataToDB
/**
 * Middleware: addNewUserDataToDB
 *
 * Inserta un nuevo usuario en la base de datos.
 * 
 * Lógica de asignación de tipo:
 * - Primer usuario del sistema → admin (ownership)
 * - Usuarios subsecuentes → guest (hasta que se conviertan en employee vía invitación)
 */
export const addNewUserDataToDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('addNewUserDataToDB');

  try {
    const { firstName, lastName, email, passwordHash, imageUrl, platformName } = req.body;

    // Validar campos mínimos
    if (!firstName || !lastName || !email) {
      res.status(400).json({ error: 'Missing required user fields' });
      return;
    }

    // Verificar existencia previa del usuario
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(409).json({ 
        success: false,
        error: 'Email address already in use' 
      });
      return;
    }

    // #step 1 - Verificar si es el primer usuario del sistema
    const [anyUser] = await db
      .select()
      .from(usersTable)
      .limit(1);
    
    const isFirstUser = !anyUser;
    console.log(`🔍 ¿Es el primer usuario? ${isFirstUser ? 'SÍ' : 'NO'}`);
    // #end-step

    // #step 2 - Asignar tipo de usuario según lógica de negocio
    const userType: 'admin' | 'guest' = isFirstUser ? 'admin' : 'guest';
    const userState: 'pending' | 'active' = isFirstUser ? 'active' : 'pending';
    const isActive = isFirstUser; // Primer usuario (admin) se activa automáticamente
    
    console.log(`👤 Tipo de usuario: ${userType}`);
    console.log(`📊 Estado: ${userState}`);
    console.log(`✅ isActive: ${isActive}`);
    // #end-step

    // Construir datos del usuario
    const newUserData = {
      firstName,
      lastName,
      email,
      passwordHash: passwordHash ?? '',
      imageUrl: platformName === 'google' ? imageUrl ?? null : null,
      type: userType,
      state: userState,
      isActive,
    };

    // Insertar en la base de datos
    await db.insert(usersTable).values(newUserData);

    console.log(`✅ Usuario creado exitosamente como ${userType}`);

    next();
  } catch (err) {
    console.error('❌ Error en addNewUserDataToDB:', err);
    res.status(500).json({ error: 'Error adding user to database' });
  }
};
// #end-middleware
// #middleware fetchUserDataFromDB
/**
 * Middleware: fetchUserDataFromDB
 *
 * Recupera al usuario recién insertado y prepara el objeto userDataStore
 * para los siguientes middlewares (ej. creación de JWT).
 */
export const fetchUserDataFromDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
     
    if (!user) {
      res.status(500).json({ error: 'Failed to retrieve inserted user' });
      return;
    }

    // Preparar objeto UserDataStore
    req.body.userDataStore = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      state: user.state,
      isAuthenticated: false,
    };

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user from database' });
  }
};
// #end-middleware
// #middleware createJWT
/**
 * Middleware: createJWT
 *
 * Crea un token JWT a partir del ID del usuario recién creado
 * y lo agrega a req.body.jwtToken para uso posterior.
 */

export const createJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('createJWT');
  try {
    const { userDataStore } = req.body;
    if (!userDataStore || !userDataStore.id) {
      res.status(400).json({ error: 'Missing user ID for JWT creation' });
      return;
    }

    // Usar el módulo jwtManager
    const token = signJWT({ 
      userId: userDataStore.id,
      email: userDataStore.email,
      type: userDataStore.type,
      branchId: userDataStore.branchId ?? null,
      companyId: userDataStore.companyId ?? null,
      permissions: userDataStore.permissions ?? null,
      state: userDataStore.state,
    });
    res.locals.jwtToken = token;

    next();
  } catch {
    res.status(500).json({ error: 'Error creating JWT' });
  }
};
// #end-middleware
// #middleware setJWTonCookies
/**
 * Middleware: setJWTonCookies
 *
 * Agrega el JWT generado en una cookie HTTP-only y segura.
 * La cookie expira junto con el token.
 */
export const setJWTonCookies = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('setJWTonCookies');
  try {
    const jwtToken = res.locals.jwtToken;
    if (!jwtToken) {
      res.status(400).json({ error: 'Missing JWT token for cookie setup' });
      return;
    }

    // Usar el módulo jwtManager con configuración centralizada
    setJWTCookie(res, jwtToken);
    next();
  } catch (err) {
    console.error('Error in setJWTonCookies:', err);
    next(err);
  }
};
// #end-middleware
// #middleware returnUserData
export const returnUserData = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.log('returnUserData');
  try {
    // ← CAMBIO: buscar en req.body O en res.locals
    const userDataStore = req.body?.userDataStore || res.locals.userDataStore;
    
    if (!userDataStore) {
      res.status(400).json({ error: 'Missing user data for response' });
      return;
    }

    const { id, firstName, lastName, email, type, state, imageUrl, branchId, companyId, permissions, isAuthenticated } = userDataStore;

    const statusCode = isAuthenticated ? 200 : 201;

    res.status(statusCode).json({
      success: true,  
      data: {         
        user: {
          id,
          firstName,
          lastName,
          email,
          type,
          branchId,
          companyId,
          permissions,
          state,
          imageUrl,
        },
      },
    });
  } catch {
    res.status(500).json({ 
      success: false,
      error: 'Error returning user data' 
    });
  }
};
// #end-middleware
// #middleware validateLoginPayload
/**
 * Middleware: validateLoginPayload
 * Valida y normaliza los datos recibidos en el login según la plataforma.
 * Si es válido, reemplaza los valores procesados en req.body.
 */
export const validateLoginPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('validateLoginPayload');
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (!data.platformName) {
      return res.status(400).json({ error: "Missing field platformName in body" });
    }

    if (data.platformName === "local") {
      const { email, password } = data;

      // Validaciones básicas de presencia
      if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validar formato de email
      const processedEmail = validateAndProcessEmail(email);
      
      // Validar formato de password (no hash aquí, solo formato)
      validatePassword(password);

      // Reasignar datos normalizados
      req.body = {
        platformName: "local",
        email: processedEmail,
        password
      };

      return next();
    }

    if (data.platformName === "google") {
      const { platformToken, email } = data;

      if (!platformToken) {
        return res.status(400).json({ error: "Missing platformToken" });
      }

      // Validar email si viene (opcional pero recomendado)
      const processedEmail = email ? validateAndProcessEmail(email) : null;

      req.body = {
        platformName: "google",
        platformToken: platformToken.trim(),
        email: processedEmail,  // ← AGREGAR ESTA LÍNEA
      };

      return next();
    }

    return res.status(400).json({ error: "Invalid platform value" });
  } catch (err) {
    console.error('Error in validateLoginPayload:', err);
    return res.status(400).json({ error: (err as Error).message });
  }
};
// #end-middleware
// #middleware getUserFromDB
/**
 * Middleware: getUserFromDB
 *
 * Busca al usuario en la base de datos según la plataforma (local o google).
 * Para local: valida email y password.
 * Para google: busca por token de plataforma.
 */
export const getUserFromDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('getUserFromDB');
  console.log('📦 req.body:', req.body);
  
  try {
    const { platformName, email, password, platformToken } = req.body;
    
    console.log('🔍 platformName:', platformName);
    console.log('📧 email:', email);

  if (platformName === 'local') {
  console.log('🔑 Buscando usuario en DB con email:', email);
  
  // Buscar usuario por email
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
  
  if (!user) {
    console.log('❌ Usuario no encontrado');
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  console.log('🔐 Verificando password...');
  console.log('🔐 user.passwordHash existe:', !!user.passwordHash);

  // Verificar contraseña usando la utilidad consistente
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  console.log('✅ Password válido:', isPasswordValid);

  if (!isPasswordValid) {
    console.log('❌ Password inválido');
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  console.log('✅ Usuario autenticado correctamente');

  // Cargar permisos y companyId si es empleado
  let permissions = null as unknown;
  let companyId = null as number | null;
  
  if (user.type === 'employee' && user.branchId) {
    console.log('  📍 Loading EMPLOYEE data...');
    console.log('    - user.id:', user.id);
    console.log('    - user.branchId:', user.branchId);

    // Cargar permisos
    const [dbPerms] = await db
      .select()
      .from(employeePermissionsTable)
      .where(eq(employeePermissionsTable.userId, user.id))
      .limit(1);

    console.log('    - dbPerms found:', !!dbPerms);
    if (dbPerms) {
      console.log('    - dbPerms data:', dbPerms);
    }

    permissions = dbPerms
      ? dbPermissionsToAppFormat(dbPerms as any)
      : DEFAULT_EMPLOYEE_PERMISSIONS;

    console.log('    - permissions (formatted):', permissions);

    // Derivar companyId del branchId
    const [branch] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.id, user.branchId))
      .limit(1);

    console.log('    - branch found:', !!branch);
    companyId = branch?.companyId ?? null;
    console.log('    - companyId (derived):', companyId);
  }

  // Preparar objeto UserDataStore
  console.log('\n📦 [LOGIN] Preparing UserDataStore:');
  req.body.userDataStore = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl ?? null,
    type: user.type,
    branchId: user.branchId ?? null,
    companyId,
    permissions,
    state: user.state,
    isAuthenticated: true,
  };
  console.log('  - userDataStore:', req.body.userDataStore);

  console.log('📤 userDataStore creado:', req.body.userDataStore);
  console.log('➡️ Llamando a next()');

  next();
  } else if (platformName === 'google') {
    console.log('🔍 Buscando en api_platforms con platformToken:', platformToken);
    
    // Buscar usuario por platformToken en la tabla api_platforms
    const { apiPlatformsTable } = await import('../../db/schema');
    
    const [platform] = await db
      .select()
      .from(apiPlatformsTable)
      .where(eq(apiPlatformsTable.platformToken, platformToken))
      .limit(1);

    console.log('🔍 Platform encontrado:', platform);

    if (!platform) {
      console.log('❌ No se encontró platformToken en api_platforms');
      res.status(401).json({ error: 'Invalid Google token or user not registered' });
      return;
    }

    console.log('✅ Platform encontrado, buscando usuario con userId:', platform.userId);

    // Buscar datos del usuario
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, platform.userId))
      .limit(1);

    console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');

    if (!user) {
      console.log('❌ Usuario no encontrado');
      res.status(401).json({ error: 'User not found' });
      return;
    }

    console.log('✅ Usuario encontrado, preparando userDataStore');

    // Cargar permisos y companyId si es empleado
    let permissions = null as unknown;
    let companyId = null as number | null;
    
    if (user.type === 'employee' && user.branchId) {
      // Cargar permisos
      const [dbPerms] = await db
        .select()
        .from(employeePermissionsTable)
        .where(eq(employeePermissionsTable.userId, user.id))
        .limit(1);

      permissions = dbPerms
        ? dbPermissionsToAppFormat(dbPerms as any)
        : DEFAULT_EMPLOYEE_PERMISSIONS;

      // Derivar companyId del branchId
      const [branch] = await db
        .select()
        .from(branchesTable)
        .where(eq(branchesTable.id, user.branchId))
        .limit(1);

      companyId = branch?.companyId ?? null;
    }

    // Preparar objeto UserDataStore
    req.body.userDataStore = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      companyId,
      permissions,
      state: user.state,
      isAuthenticated: true,
    };

    console.log('📤 userDataStore creado:', req.body.userDataStore);
    console.log('➡️ Llamando a next()');

    next();
  } else {
    console.log('❌ Platform inválido:', platformName);
    res.status(400).json({ error: 'Invalid platform' });
  }
  } catch (err) {
    console.error('💥 Error in getUserFromDB:', err);
    res.status(500).json({ error: 'Error fetching user from database' });
  }
};
// #end-middleware
// #middleware savePlatformToken
/**
 * Middleware: savePlatformToken
 * 
 * Guarda el token de plataforma externa en la tabla api_platforms.
 * Solo se ejecuta para plataformas externas (google, facebook, x).
 * Para plataforma local, simplemente continúa sin hacer nada.
 * 
 * Flujo:
 * 1. Verifica si platformName es diferente de 'local'
 * 2. Obtiene el userId del usuario recién creado
 * 3. Inserta el registro en api_platforms
 * 
 * Errores:
 * - Si falta el platformToken, responde con 400
 * - Si ocurre un error al guardar, responde con 500
 */
export const savePlatformToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('savePlatformToken');
  
  try {
    const { platformName, platformToken, email } = req.body;

    // Si es plataforma local, no hacer nada
    if (platformName === 'local') {
      console.log('Platform local - skipping api_platforms insert');
      return next();
    }

    // Para plataformas externas (google, facebook, x)
    console.log('Platform externa detectada:', platformName);

    // Validar que existe el platformToken
    if (!platformToken) {
      res.status(400).json({ error: 'Missing platformToken for external platform' });
      return;
    }

    // Obtener el userId del usuario recién creado
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.status(500).json({ error: 'User not found after creation' });
      return;
    }

    console.log('Guardando platformToken en api_platforms para userId:', user.id);

    // Importar la tabla api_platforms
    const { apiPlatformsTable } = await import('../../db/schema');

    // Insertar en api_platforms
    await db.insert(apiPlatformsTable).values({
      userId: user.id,
      platformName: platformName,
      platformToken: platformToken,
      linkedAt: new Date(),
    });

    console.log('✅ platformToken guardado correctamente');

    next();
  } catch (err) {
    console.error('Error in savePlatformToken:', err);
    res.status(500).json({ error: 'Error saving platform token' });
  }
};
// #end-middleware
// #middleware fetchUserDataByUserId
export const fetchUserDataByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('fetchUserDataByUserId - START');
  
  try {
    const userId = (req as any).user?.userId;
    
    console.log('📌 userId from JWT:', userId);

    if (!userId) {
      console.log('❌ Missing userId');
      res.status(400).json({ error: 'Missing user ID from token' });
      return;
    }

    console.log('🔍 Buscando usuario con ID:', userId);

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    
    console.log('👤 Usuario encontrado:', user ? 'SÍ' : 'NO');
     
    if (!user) {
      console.log('❌ User not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Cargar permisos y companyId si es empleado
    let permissions = null as unknown;
    let companyId = null as number | null;

    if (user.type === 'employee' && user.branchId) {
      // Cargar permisos
      const [dbPerms] = await db
        .select()
        .from(employeePermissionsTable)
        .where(eq(employeePermissionsTable.userId, user.id))
        .limit(1);

      permissions = dbPerms
        ? dbPermissionsToAppFormat(dbPerms as any)
        : DEFAULT_EMPLOYEE_PERMISSIONS;

      // Derivar companyId del branchId
      const [branch] = await db
        .select()
        .from(branchesTable)
        .where(eq(branchesTable.id, user.branchId))
        .limit(1);

      companyId = branch?.companyId ?? null;
    }

    res.locals.userDataStore = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      companyId,
      permissions,
      state: user.state,
      isAuthenticated: true,
    };

    console.log('✅ userDataStore creado');

    next();
  } catch (err) {
    console.error('💥 Error in fetchUserDataByUserId:', err);
    res.status(500).json({ error: 'Error fetching user from database' });
  }
};
// #end-middleware