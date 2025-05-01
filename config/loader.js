const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, './config.js');

let config = require(configPath);
let reloadTimeout;
let listeners = [];

fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
        if (reloadTimeout) clearTimeout(reloadTimeout);

        reloadTimeout = setTimeout(() => {
            console.log('[CONFIG] Detected change. Reloading config...');
            try {
                delete require.cache[require.resolve(configPath)];
                console.log('[CONFIG] Reloaded successfully.');
                listeners.forEach(fn => fn(config));
            } catch (err) {
                console.error('[CONFIG] Failed to reload:', err);
            }
        }, 100);
    }
});

module.exports = {
    getConfig: () => config,
    onChange: (fn) => {
        listeners.push(fn);
    }
};
