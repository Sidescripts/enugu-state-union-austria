const { body } = require('express-validator');

// Validation rules
const createAnnouncementValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('isImportant')
    .optional()
    .isBoolean()
    .withMessage('isImportant must be a boolean'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid date')
];

const updateImageValidations = [
  body('image')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Image must be a valid URL')
];

const updateStatusValidations = [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

module.exports = {
    updateImageValidations,
    updateStatusValidations,
    createAnnouncementValidation
}