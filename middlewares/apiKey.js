const CONFIG = require('../config/config');
const API_KEY = CONFIG.API_KEY;

const apiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(403).json({
            status: 'failed',
            message: 'Invalid API key'
        });
    }
    next();
};

module.exports = apiKey;
