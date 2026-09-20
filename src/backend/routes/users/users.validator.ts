import { Request, Response, NextFunction } from 'express';

export function validateCreateUser(req: Request, res: Response, next: NextFunction): void {
  const { username, name, password, role, department, email } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    res.status(400).json({ error: 'Username is required and must be at least 3 characters long' });
    return;
  }

  if (!password || typeof password !== 'string' || password.trim().length < 6) {
    res.status(400).json({ error: 'Password is required and must be at least 6 characters long' });
    return;
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Full name is required' });
    return;
  }

  if (!role || typeof role !== 'string') {
    res.status(400).json({ error: 'Valid role is required' });
    return;
  }

  if (!department || typeof department !== 'string') {
    res.status(400).json({ error: 'Valid department is required' });
    return;
  }

  if (email && (typeof email !== 'string' || !email.includes('@'))) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  next();
}

export function validateUpdateUser(req: Request, res: Response, next: NextFunction): void {
  const { username, name, password, email } = req.body;

  if (username !== undefined && (typeof username !== 'string' || username.trim().length < 3)) {
    res.status(400).json({ error: 'Username must be at least 3 characters long' });
    return;
  }

  if (password !== undefined && (typeof password !== 'string' || password.trim().length < 6)) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    res.status(400).json({ error: 'Name cannot be empty' });
    return;
  }

  if (email !== undefined && (typeof email !== 'string' || !email.includes('@'))) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  next();
}
