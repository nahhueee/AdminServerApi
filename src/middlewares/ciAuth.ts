import { Request, Response, NextFunction } from 'express';

export function validarTokenCI(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = auth.split(' ')[1];

  if (token !== process.env.CI_UPLOAD_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  next();
}
