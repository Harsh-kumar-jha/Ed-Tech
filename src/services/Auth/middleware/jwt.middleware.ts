import { Request, Response, NextFunction, RequestHandler } from 'express';
import { TokenService } from '../services/token.service';

const tokenService = new TokenService();

export const jwtMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = await tokenService.verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
}; 