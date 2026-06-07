import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@drift-deck/types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const val = authHeader.split(' ')[1];
    if (val && val !== 'undefined' && val !== 'null') {
      token = val;
    }
  }
  
  if (!token && req.query.token && typeof req.query.token === 'string') {
    const val = req.query.token;
    if (val !== 'undefined' && val !== 'null') {
      token = val;
    }
  }

  if (!token) {
    console.warn(`[Auth] Blocked request to ${req.path}: Missing or invalid token format. Headers:`, req.headers, 'Query token:', req.query.token);
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'drift_deck_dev_secret_jwt_key_2026_xyz'
    ) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error(`[Auth] JWT verification failed for request to ${req.path}:`, error.message, 'Token used (length ' + token.length + '):', token.substring(0, 15) + '...');
    return res.status(401).json({ error: `Unauthorized: Invalid token: ${error.message}` });
  }
}
