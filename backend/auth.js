import jwt from 'jsonwebtoken';
import { pool } from './database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    if (roleHierarchy[req.user.role] >= roleHierarchy[requiredRole]) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};