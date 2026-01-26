import { body, query, param, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Common validation rules
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Valid email is required');

export const passwordValidation = body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character');

export const usernameValidation = body('username')
  .isAlphanumeric()
  .isLength({ min: 3, max: 30 })
  .trim()
  .escape()
  .withMessage('Username must be 3-30 alphanumeric characters');

// ID validation for MongoDB ObjectIds
export const mongoIdValidation = (paramName = 'id') => 
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format');

// Sanitize all string inputs
export const sanitizeInputs = [
  body('*').trim().escape(),
  query('*').trim().escape()
];