import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_MESSAGES } from '../routes/auth/auth.constants';
import { JWT_SECRET } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    name: string;
    department: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: AUTH_MESSAGES.UNAUTHORIZED,
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: AUTH_MESSAGES.TOKEN_EXPIRED,
    });
  }
}

const ROLE_EQUIVALENTS: Record<string, string[]> = {
  'Administrator': ['IT Administrator', 'Administrator', 'Management', 'Super Administrator'],
  'IT Administrator': ['Administrator', 'IT Administrator', 'Management', 'Super Administrator'],
  'Management': ['Administrator', 'IT Administrator', 'Management', 'Super Administrator'],
  'Laboratory Scientist': ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Laboratory'],
  'Lab Technician': ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Laboratory'],
  'Scientist': ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Laboratory'],
  'Laboratory': ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Laboratory'],
  'Nurse': ['Nurse', 'Head Nurse'],
  'Head Nurse': ['Nurse', 'Head Nurse'],
  'Cashier': ['Cashier', 'Account Officer', 'Accountant'],
  'Account Officer': ['Cashier', 'Account Officer', 'Accountant'],
  'Accountant': ['Cashier', 'Account Officer', 'Accountant'],
  'HR Manager': ['HR Manager', 'Human Resources', 'Human Resource Manager'],
  'Human Resources': ['HR Manager', 'Human Resources', 'Human Resource Manager'],
  'Human Resource Manager': ['HR Manager', 'Human Resources', 'Human Resource Manager'],
  'OPD Clerk': ['OPD Clerk', 'Receptionist', 'Records Officer'],
  'Receptionist': ['OPD Clerk', 'Receptionist', 'Records Officer'],
  'Records Officer': ['OPD Clerk', 'Receptionist', 'Records Officer']
};

export function isRoleAuthorized(userRole: string, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  // System administrators and IT Management have access across administrative modules
  if (['IT Administrator', 'Administrator', 'Management', 'Super Administrator'].includes(userRole)) {
    return true;
  }
  if (allowedRoles.includes(userRole)) {
    return true;
  }
  const userEquivalents = ROLE_EQUIVALENTS[userRole] || [userRole];
  for (const role of userEquivalents) {
    if (allowedRoles.includes(role)) {
      return true;
    }
  }
  return false;
}

export function authorizeRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: AUTH_MESSAGES.UNAUTHORIZED,
      });
      return;
    }

    if (!isRoleAuthorized(req.user.role, allowedRoles)) {
      res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.FORBIDDEN,
      });
      return;
    }

    next();
  };
}
