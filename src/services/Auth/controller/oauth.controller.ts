import { Request, Response, NextFunction } from 'express';
import passport from '../../../config/passport';
import { generateTokens } from '../utils/auth';

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });
export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Google authentication failed' });
    }
    const tokens = generateTokens(user);
    // You may want to redirect with tokens or set cookies here
    return res.json(tokens);
  })(req, res, next);
};

export const microsoftAuth = passport.authenticate('azuread-openidconnect');
export const microsoftCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('azuread-openidconnect', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Microsoft authentication failed' });
    }
    const tokens = generateTokens(user);
    // You may want to redirect with tokens or set cookies here
    return res.json(tokens);
  })(req, res, next);
}; 