const { body, validationResult } = require('express-validator');
const xss = require('xss');
const CONFIG = require('../config/config');

const sanitation = CONFIG.WEBHOOK_SANITATION;

const validation = [
    body('recipient')
        .isArray()
        .withMessage('Recipient must be an array of numbers')
        .custom((value) => {
            value.forEach((recipient) => {
                if (!Number.isInteger(Number(recipient))) {
                    throw new Error('Each recipient must be a valid number');
                }
            });
            return true;
        }),

    body('data')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('Data must be a string if provided')
        .trim()
        .withMessage('Data is required and must be a string')
        .customSanitizer((value) => {
            return sanitation ? xss(value) : value;
        }),

    body('image')
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage('Image is required and must be a valid URL')
        .trim()
        .withMessage('Image must be a string if provided')
        .customSanitizer((value) => {
            return sanitation ? xss(value) : value;
        }),

    body('audio')
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage('Audio is required and must be a valid URL')
        .trim()
        .withMessage('Audio must be a string if provided')
        .customSanitizer((value) => {
            return sanitation ? xss(value) : value;
        }),

    body('video')
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage('Video is required and must be a valid URL')
        .trim()
        .withMessage('Video must be a string if provided')
        .customSanitizer((value) => {
            return sanitation ? xss(value) : value;
        }),

    body('location')
        .optional({ checkFalsy: true })
        .isString()
        .withMessage('Location must be a string if provided')
        .trim()
        .withMessage('Location is required and must be a string')
        .customSanitizer((value) => {
            return sanitation ? xss(value) : value;
        }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'failed',
                message: errors.array().map((error) => error.msg).join(', ')
            });
        }
        next();
    }
];

module.exports = validation;
