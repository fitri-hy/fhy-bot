const cors = require('cors');
const CONFIG = require('../config/config');

module.exports = (options = {}) => {
  const defaultOptions = {
    origin: CONFIG.CORS_ORIGIN,
    credentials: CONFIG.CORS_CREDENTIALS,
  };

  return cors({ ...defaultOptions, ...options });
};
