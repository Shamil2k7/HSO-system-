import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'SALESMANAGER';
    status: string;
  };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_12345';
    const decoded = jwt.verify(token, secret) as any;
    
    const userObj = await User.findById(decoded.id).select('status role name email');
    if (!userObj) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    if (userObj.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = {
      id: userObj._id.toString(),
      name: userObj.name,
      email: userObj.email,
      role: userObj.role as any,
      status: userObj.status,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin has access to all routes by definition
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};
