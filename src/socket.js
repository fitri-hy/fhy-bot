const CONFIG = require('../config/config');
const makeWASocket = require("@whiskeysockets/baileys").default;
const { DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");

const { createAuthState } = require("./auth");
const { incomingMessage, loadPlugins, watchPlugins } = require("./message");
const { groupParticipantUpdate } = require("./group");

let reconnectAttempts = 0;
const features = { usePairingCode: CONFIG.SOCKET_PAIRING };
const phone = CONFIG.BOT_NUMBER;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

loadPlugins();
watchPlugins();

async function startSocket(sockContainer) {
    const { state, saveCreds } = await createAuthState();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: !features.usePairingCode,
        logger: pino({ level: "silent" }),
    });

    sockContainer.sock = sock;
    sock.ev.on("creds.update", saveCreds);

    let code = null;

    if (features.usePairingCode && !sock.authState.creds.registered) {
        await delay(2000);

        let attempts = 0;
        while (attempts < CONFIG.SOCKET_ATTEMPTS && !code) {
            try {
                code = await sock.requestPairingCode(phone);
                console.log(`[SERVER] Pairing Code: ${code}`);
            } catch (error) {
                console.error("[SERVER] Error requesting pairing code:", error);
                attempts++;
                if (attempts < CONFIG.SOCKET_ATTEMPTS) {
                    console.log(`[SERVER] Retrying... Attempt ${attempts} of ${CONFIG.SOCKET_ATTEMPTS}`);
                    await delay(CONFIG.SOCKET_TIMEOUT);
                }
            }
        }

        if (!code) {
            console.error(`[SERVER] Failed to get pairing code after ${CONFIG.SOCKET_ATTEMPTS} attempts.`);
            const authFolder = path.join(__dirname, "../auth");
            if (fs.existsSync(authFolder)) {
                try {
                    fs.rmSync(authFolder, { recursive: true, force: true });
                    console.log("[SERVER] Auth folder has been deleted after failed pairing attempts.");
                } catch (err) {
                    console.error("[SERVER] Failed to delete auth folder:", err);
                }
            }
            return;
        }
    }

    if (!features.usePairingCode || !sock.authState.creds.registered) {
        if (code) {
            qrcode.generate(code, { small: true }, (qrcode) => {
                console.log(qrcode);
            });
        }
    }

	sock.ev.on("messages.upsert", async ({ messages }) => {
		const msg = messages[0];
		if (!msg || !msg.key) return;
		await incomingMessage(sock, msg);
	});

    sock.ev.on("group-participants.update", async (event) => {
        await groupParticipantUpdate(sock, event);
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
                console.log("[SERVER] Bot logout. Please rescan.");
                const authFolder = path.join(__dirname, "../auth");
                if (fs.existsSync(authFolder)) {
                    try {
                        fs.rmSync(authFolder, { recursive: true, force: true });
                        console.log("[SERVER] Auth folder has been deleted.");
                    } catch (err) {
                        console.error("[SERVER] Failed to delete auth folder:", err);
                    }
                }
                console.log("[SERVER] Trying to reconnect...");
                reconnectAttempts = 0;
                startSocket(sockContainer);
            } else {
                console.log("[SERVER] Bot disconnected, trying to reconnect...");
                reconnectAttempts++;

                if (reconnectAttempts >= CONFIG.SOCKET_ATTEMPTS) {
                    console.log(`[SERVER] Failed to reconnect ${CONFIG.SOCKET_ATTEMPTS} times. Reset connection...`);
                    const authFolder = path.join(__dirname, "../auth");
                    if (fs.existsSync(authFolder)) {
                        try {
                            fs.rmSync(authFolder, { recursive: true, force: true });
                            console.log(`[SERVER] Auth folder has been deleted after ${CONFIG.SOCKET_ATTEMPTS} attempts.`);
                        } catch (err) {
                            console.error("[SERVER] Failed to delete auth folder:", err);
                        }
                    }
                    reconnectAttempts = 0;
                }

                setTimeout(() => startSocket(sockContainer), CONFIG.SOCKET_TIMEOUT);
            }
        } else if (connection === "open") {
            console.log("[SERVER] Bot successfully connected!");
            reconnectAttempts = 0;
            sockContainer.sock = sock;
        }
    });

    return sock;
}

module.exports = { startSocket };
