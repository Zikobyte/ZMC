import { Request, Response, NextFunction } from 'express';

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim() === '') {
    res.status(400).json({ error: 'Username is required and must be a valid string' });
    return;
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({ error: 'Password is required and must be a valid string' });
    return;
  }

  next();
}
