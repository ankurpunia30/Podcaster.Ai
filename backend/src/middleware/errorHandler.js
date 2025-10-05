// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle known error types
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation error', errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default server error
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
