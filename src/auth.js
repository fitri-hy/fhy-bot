const { useMultiFileAuthState } = require("@whiskeysockets/baileys");

async function createAuthState() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    return { state, saveCreds };
}

module.exports = { createAuthState };
