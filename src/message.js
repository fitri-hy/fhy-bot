const CONFIG = require('../config/config');
const { MessageType, Mimetype } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EMOJIS = {
    loading: '🕒',
    success: '✅',
    error: '❌'
};

const PLUGIN_DIR = path.join(__dirname, '../plugin');
let plugins = [];

function checkAndInstallDependencies(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const requireRegex = /require\(['"](.+?)['"]\)/g;
    let match;
    const dependencies = [];

    while ((match = requireRegex.exec(content)) !== null) {
        const pkg = match[1];
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
            dependencies.push(pkg);
        }
    }

    for (const dep of dependencies) {
        try {
            require.resolve(dep);
        } catch (e) {
            console.log(`[PLUGIN] Installing missing dependency: ${dep}`);
            execSync(`npm install ${dep}`, { stdio: 'inherit' });
        }
    }
}

function loadPlugins() {
    plugins = [];

    const files = fs.readdirSync(PLUGIN_DIR);
    let loadedCount = 0;

    for (const file of files) {
        if (file.endsWith('.js')) {
            const pluginPath = path.join(PLUGIN_DIR, file);
            delete require.cache[require.resolve(pluginPath)];
            checkAndInstallDependencies(pluginPath);

            try {
                const plugin = require(pluginPath);
                if (typeof plugin === 'function') {
                    plugins.push({ func: plugin, filename: file });
                    loadedCount++;
                } else {
                    console.warn(`[PLUGIN] Skipped: ${file} (not a function)`);
                }
            } catch (err) {
                console.error(`[PLUGIN] Failed to load: ${file}`, err.message);
            }
        }
    }

    console.log(`[PLUGIN] Successfully loaded ${loadedCount} plugin(s).`);
}

function watchPlugins() {
    if (!fs.existsSync(PLUGIN_DIR)) {
        console.error('[PLUGIN] Plugin directory not found!');
        return;
    }

    fs.watch(PLUGIN_DIR, (eventType, filename) => {
        if (filename && filename.endsWith('.js')) {
            console.log(`[PLUGIN] Change detected: ${filename}`);
            loadPlugins();
        }
    });

    console.log('[PLUGIN] Watching for plugin changes...');
}

async function handleAddPlugin(msg, sock, sender, message) {

    if (msg.startsWith('.add-plugin ')) {
        const parts = msg.slice(12).split('\n');
        const filename = parts[0].trim();
        const code = parts.slice(1).join('\n');

        if (!filename || !filename.endsWith('.js')) {
            await sock.sendMessage(sender, { text: 'Please provide a valid JavaScript file name with the ".js" extension.' });
            return;
        }

        const pluginPath = path.join(PLUGIN_DIR, filename);

        try {
            await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });
            fs.writeFileSync(pluginPath, code, 'utf-8');
            console.log(`[PLUGIN] Plugin ${filename} has been ${fs.existsSync(pluginPath) ? 'updated' : 'added'}.`);
            await sock.sendMessage(sender, {
                text: `Plugin ${filename} has been successfully ${fs.existsSync(pluginPath) ? 'updated' : 'added'}.`
            }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
        } catch (error) {
            console.error(`[PLUGIN ERROR] Failed to write ${filename}:`, error);
            await sock.sendMessage(sender, { text: `Failed to add or update plugin ${filename}.` }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.error, key: message.key } });
        }
    }

    if (msg.startsWith('.list-plugin')) {
        try {
            await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });
            const files = fs.readdirSync(PLUGIN_DIR).filter(file => file.endsWith('.js'));
            if (files.length === 0) {
                await sock.sendMessage(sender, { text: 'No plugins found.' }, { quoted: message });
            } else {
				const pluginListText = files.map((file, index) => `*${index + 1}.* \`${file}\``).join('\n');
                await sock.sendMessage(sender, { text: `*List of Plugins:*\n\n${pluginListText}` }, { quoted: message });
            }
            await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
        } catch (error) {
            console.error('[PLUGIN ERROR] Failed to list plugins:', error);
            await sock.sendMessage(sender, { text: 'Failed to list plugins.' }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.error, key: message.key } });
        }
    }

    if (msg.startsWith('.delete-plugin ')) {
        const filename = msg.slice(15).trim();

        if (!filename || !filename.endsWith('.js')) {
            await sock.sendMessage(sender, {
                text: 'Please provide a valid JavaScript file name with the ".js" extension to delete.'
            }, { quoted: message });
            return;
        }

        const pluginPath = path.join(PLUGIN_DIR, filename);

        try {
            await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });

            if (fs.existsSync(pluginPath)) {
                fs.unlinkSync(pluginPath);
                console.log(`[PLUGIN] Plugin ${filename} has been deleted.`);
                await sock.sendMessage(sender, {
                    text: `Plugin ${filename} has been successfully deleted.`
                }, { quoted: message });
            } else {
                console.log(`[PLUGIN ERROR] Plugin ${filename} not found at ${pluginPath}.`);
                await sock.sendMessage(sender, {
                    text: `Plugin ${filename} not found.`
                }, { quoted: message });
            }

            await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
        } catch (error) {
            console.error(`[PLUGIN ERROR] Failed to delete ${filename}:`, error.message);
            await sock.sendMessage(sender, {
                text: `Failed to delete plugin ${filename}. Error: ${error.message}`
            }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.error, key: message.key } });
        }
    }
	
	if (msg.startsWith('.copy-plugin ')) {
        const filename = msg.slice(13).trim();

        if (!filename || !filename.endsWith('.js')) {
            await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });
            await sock.sendMessage(sender, { text: 'Please provide a valid JavaScript file name with the ".js" extension to copy.' }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
            return;
        }

        const pluginPath = path.join(PLUGIN_DIR, filename);

        try {
            if (fs.existsSync(pluginPath)) {
				await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });
                const code = fs.readFileSync(pluginPath, 'utf-8');
                await sock.sendMessage(sender, { text: `*Here is the content of ${filename}:*\n\n\`\`\`\n${code}\n\`\`\`` }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
            } else {
				await sock.sendMessage(sender, { react: { text: EMOJIS.loading, key: message.key } });
                console.log(`[PLUGIN ERROR] Plugin ${filename} not found at ${pluginPath}.`);
                await sock.sendMessage(sender, { text: `Plugin *${filename}* not found.` }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: EMOJIS.success, key: message.key } });
            }
        } catch (error) {
            console.error(`[PLUGIN ERROR] Failed to copy ${filename}:`, error.message);
            await sock.sendMessage(sender, { text: `Failed to copy plugin *${filename}*.` }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: EMOJIS.error, key: message.key } });
        }
    }
}

async function incomingMessage(sock, message) {
	if (CONFIG.MESSAGE_LOG_RAW) {
        console.log(JSON.stringify(message, null, 2));
    }
	
    const msg = message.message?.conversation || message.message?.extendedTextMessage?.text;
    const sender = message.key.remoteJid;
    const fromMe = message.key.fromMe;

    if (!msg) return;

    if (CONFIG.SELF_MODE_PLUGIN) {
        if (fromMe) {
            await handleAddPlugin(msg, sock, sender, message);
        }
    } else {
        await handleAddPlugin(msg, sock, sender, message);
    }

    for (const { func, filename } of plugins) {
        try {
            const pluginConfig = require(path.join(PLUGIN_DIR, filename));
            const isGlobalModeEnabled = pluginConfig?.SELF ?? CONFIG.SELF_MODE_GLOBAL;
            if (isGlobalModeEnabled && fromMe) {
                await func(sock, message, msg, sender);
            } else if (!isGlobalModeEnabled) {
                await func(sock, message, msg, sender);
            }
        } catch (error) {
            console.error(`[PLUGIN] ERROR ${filename}:`, error.message);
            await sock.sendMessage(sender, { react: { text: EMOJIS.error, key: message.key } });
        }
    }
}

module.exports = { incomingMessage, loadPlugins, watchPlugins };
