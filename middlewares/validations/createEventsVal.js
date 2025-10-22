const { body } = require('express-validator');

// Validation rules
const createEventValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('videos')
    .optional()
    .isArray()
    .withMessage('Videos must be an array')
];

module.exports = createEventValidation