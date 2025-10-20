const { body } = require('express-validator');

// Validation rules
const createExecutiveValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be less than 255 characters'),
  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ max: 255 })
    .withMessage('Position must be less than 255 characters'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer')
];

const updateImageValidation = [
  body('image')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Image must be a valid URL')
];

const updateStatusValidation = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];


module.exports = {
    updateImageValidation, 
    updateStatusValidation, 
    createExecutiveValidation
};