import jwt from 'jsonwebtoken';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next({ status: 401, message: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (_e) {
    next({ status: 401, message: 'Invalid token' });
  }
};

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next({ status: 403, message: 'Forbidden' });
  next();
};


