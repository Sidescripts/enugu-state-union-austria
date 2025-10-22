// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized to access this resource') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds for this transaction') {
    super(message, 400);
    this.name = 'InsufficientFundsError';
  }
}

class TransactionError extends AppError {
  constructor(message = 'Transaction failed') {
    super(message, 400);
    this.name = 'TransactionError';
  }
}

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    const message = messages.join('. ');
    error = new ValidationError(message);
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    const message = `${field} already exists`;
    error = new ValidationError(message);
  }

  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Invalid reference. Related record does not exist';
    error = new ValidationError(message);
  }

  // Sequelize Database Error
  if (err.name === 'SequelizeDatabaseError') {
    const message = 'Database operation failed';
    error = new AppError(message, 500);
  }

  // Sequelize Connection Error
  if (err.name === 'SequelizeConnectionError') {
    const message = 'Database connection failed';
    error = new AppError(message, 503);
  }

  // Sequelize Timeout Error
  if (err.name === 'SequelizeConnectionTimedOutError') {
    const message = 'Database connection timeout';
    error = new AppError(message, 503);
  }

  // MySQL2 specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry. Record already exists';
    error = new ValidationError(message);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Invalid reference. Related record does not exist';
    error = new ValidationError(message);
  }

  if (err.code === 'ER_DATA_TOO_LONG') {
    const message = 'Data too long for field';
    error = new ValidationError(message);
  }

  if (err.code === 'ER_BAD_NULL_ERROR') {
    const message = 'Required field cannot be null';
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again';
    error = new AuthenticationError(message);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    const message = `File upload error: ${err.message}`;
    error = new ValidationError(message);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

// 404 Not Found Handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async Handler Wrapper (to avoid try-catch in every controller)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InsufficientFundsError,
  TransactionError,
  errorHandler,
  notFound,
  asyncHandler
};