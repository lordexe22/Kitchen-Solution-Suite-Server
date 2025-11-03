/* src\modules\jwtManager\jwtManager.routes.ts */
// #section imports
import { Router, Request, Response } from 'express';
import { verifyJWT, signJWT, getJWTFromCookie, setJWTCookie, clearJWTCookie } from './jwtManager.utils';
import { authenticateJWT } from './jwtManager.middlewares';
// #end-section
// #variable router
const router = Router();
// #end-variable
// #route - /refresh
router.post('/refresh', (req: Request, res: Response) => {
  const oldToken = getJWTFromCookie(req);
  
  if (!oldToken) {
    return res.status(401).json({ 
      success: false,
      error: 'No token to refresh' 
    });
  }
  
  try {
    const payload = verifyJWT(oldToken);
    const newToken = signJWT({ userId: payload.userId }, '30d');
    setJWTCookie(res, newToken);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed'
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
});
// #end-route
// #route - /logout
router.post('/logout', authenticateJWT, (req: Request, res: Response) => {
  clearJWTCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
// #end-route
export default router;
