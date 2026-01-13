// src/middlewares/auth.middlewares.ts
// #section Imports
import { Request, Response, NextFunction } from "express";
import { db } from "../db/init";
import { usersTable, apiPlatformsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../utils/password.utils";
import { createJWT, setJWTCookie, decodeJWT, getJWTFromCookie } from "../lib/modules/jwtCookieManager";
// #end-section

// #middleware validateRegisterPayload - Validates registration data
export const validateRegisterPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { platformName, firstName, lastName, email, password, platformToken, imageUrl } = req.body;

    if (!platformName || (platformName !== 'local' && platformName !== 'google')) {
      return res.status(400).json({ success: false, error: "Invalid platform" });
    }

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (platformName === 'local' && !password) {
      return res.status(400).json({ success: false, error: "Password required for local registration" });
    }

    if (platformName === 'google' && !platformToken) {
      return res.status(400).json({ success: false, error: "Platform token required for Google registration" });
    }

    // Normalize data
    req.body = {
      platformName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: platformName === 'local' ? password : undefined,
      platformToken: platformName === 'google' ? platformToken : undefined,
      imageUrl: imageUrl || null,
    };

    next();
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
};
// #end-middleware

// #middleware hashPasswordMiddleware - Hashes password for local platform
export const hashPasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platformName, password } = req.body;

    if (platformName !== 'local') {
      return next();
    }

    if (!password) {
      res.status(400).json({ error: 'Password required' });
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

// #middleware addNewUserDataToDB - Creates new user in database
export const addNewUserDataToDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email, passwordHash, imageUrl } = req.body;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      res.status(409).json({ success: false, error: 'Email already in use' });
      return;
    }

    // Check if first user (becomes admin)
    const [anyUser] = await db.select().from(usersTable).limit(1);
    const isFirstUser = !anyUser;
    
    const userType = isFirstUser ? 'admin' : 'guest';
    const userState = isFirstUser ? 'active' : 'pending';
    const isActive = isFirstUser;

    // Insert user
    await db.insert(usersTable).values({
      firstName,
      lastName,
      email,
      passwordHash: passwordHash ?? '',
      imageUrl: imageUrl ?? null,
      type: userType,
      state: userState,
      isActive,
    });

    next();
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
};
// #end-middleware

// #middleware savePlatformToken - Saves platform token if provided
export const savePlatformToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platformName, platformToken, email } = req.body;

    if (platformName === 'google' && platformToken) {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (user) {
        await db.insert(apiPlatformsTable).values({
          userId: user.id,
          platformName,
          platformToken,
        });
      }
    }

    next();
  } catch (err) {
    console.error('Error saving platform token:', err);
    next();
  }
};
// #end-middleware

// #middleware fetchUserDataFromDB - Fetches user data and prepares response
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
      res.status(500).json({ error: 'Failed to retrieve user' });
      return;
    }

    req.body.userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      state: user.state,
    };

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};
// #end-middleware

// #middleware fetchUserDataByUserId - Fetches user by ID from JWT
export const fetchUserDataByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'User ID not found in token' });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    req.body.userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl ?? null,
      type: user.type,
      branchId: user.branchId ?? null,
      state: user.state,
    };

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user data' });
  }
};
// #end-middleware

// #middleware createJWTMiddleware - Creates JWT token
export const createJWTMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.id) {
      return res.status(500).json({ error: 'User data not found' });
    }

    const token = createJWT({ userId: userData.id });
    req.body.jwtToken = token;

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error creating JWT' });
  }
};
// #end-middleware

// #middleware setJWTonCookies - Sets JWT in cookies
export const setJWTonCookies = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jwtToken } = req.body;

    if (!jwtToken) {
      return res.status(500).json({ error: 'JWT token not found' });
    }

    const cookieData = setJWTCookie(jwtToken);
    res.cookie(cookieData.name, cookieData.value, cookieData.options);

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error setting JWT cookie' });
  }
};
// #end-middleware

// #middleware returnUserData - Returns user data in response
export const returnUserData = (
  req: Request,
  res: Response
) => {
  const { userData } = req.body;
  res.json({ success: true, user: userData });
};
// #end-middleware

// #middleware validateLoginPayload - Validates login credentials
export const validateLoginPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (!data.platformName) {
      return res.status(400).json({ error: "Missing platform in body" });
    }

    if (data.platformName === "local") {
      const { email, password } = data;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      req.body = {
        platformName: "local",
        email: email.toLowerCase().trim(),
        password
      };

      return next();
    }

    if (data.platformName === "google") {
      const { password: platformToken, email } = data;

      if (!platformToken) {
        return res.status(400).json({ error: "Missing platformToken" });
      }

      req.body = {
        platformName: "google",
        platformToken: platformToken.trim(),
        email: email ? email.toLowerCase().trim() : null,
      };

      return next();
    }

    return res.status(400).json({ error: "Invalid platform value" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};
// #end-middleware

// #middleware getUserFromDB - Validates user credentials
export const getUserFromDB = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { platformName, email, password, platformToken } = req.body;

    if (platformName === 'local') {
      // Buscar usuario por email
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verificar contraseña
      const isPasswordValid = await comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      req.body.userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl ?? null,
        type: user.type,
        branchId: user.branchId ?? null,
        state: user.state,
      };

      next();
    } else if (platformName === 'google') {
      // Buscar usuario por platformToken en api_platforms
      const [platform] = await db
        .select()
        .from(apiPlatformsTable)
        .where(eq(apiPlatformsTable.platformToken, platformToken))
        .limit(1);

      if (!platform) {
        res.status(401).json({ error: 'Invalid Google token or user not registered' });
        return;
      }

      // Buscar datos del usuario
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, platform.userId))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      req.body.userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl ?? null,
        type: user.type,
        branchId: user.branchId ?? null,
        state: user.state,
      };

      next();
    } else {
      res.status(400).json({ error: 'Invalid platform' });
    }
  } catch (err) {
    console.error('Error in getUserFromDB:', err);
    res.status(500).json({ error: 'Error during login' });
  }
};
// #end-middleware

// #middleware validateJWTAndGetPayload - Validates JWT and extracts user ID
export const validateJWTAndGetPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getJWTFromCookie(req.cookies);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = decodeJWT(token);
    (req as any).userId = payload.userId;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
// #end-middleware
