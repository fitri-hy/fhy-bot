const { webhookText, webhookImage, webhookAudio, webhookVideo, webhookLocation } = require('../src/webhook');
const CONFIG = require('../config/config');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const sendWithDelay = async (recipients, callback) => {
    for (let i = 0; i < recipients.length; i++) {
        const jid = `${recipients[i]}@s.whatsapp.net`;
        await delay(CONFIG.WEBHOOK_TIMEOUT);
        try {
            await callback(jid);
            console.log(`[WEBHOOK] Sent to ${jid}`);
        } catch (error) {
            console.error(`[WEBHOOK] Failed to send to ${jid}:`, error.message);
        }
    }
};

const sendTextWebhook = async (sockContainer, body, res) => {
    const { recipient, data } = body;
    try {
        await sendWithDelay(recipient, (jid) => webhookText(sockContainer.sock, jid, data));
        res.status(200).json({ status: 'successful', message: 'Text sent' });
    } catch (err) {
        console.error('[WEBHOOK] Text webhook error:', err);
        res.status(500).json({ status: 'failed', message: 'Internal error' });
    }
};

const sendImageWebhook = async (sockContainer, body, res) => {
    const { recipient, image, data } = body;
    try {
        await sendWithDelay(recipient, (jid) => webhookImage(sockContainer.sock, jid, image, data));
        res.status(200).json({ status: 'successful', message: 'Image sent' });
    } catch (err) {
        console.error('[WEBHOOK] Image webhook error:', err);
        res.status(500).json({ status: 'failed', message: 'Internal error' });
    }
};

const sendAudioWebhook = async (sockContainer, body, res) => {
    const { recipient, audio } = body;
    try {
        await sendWithDelay(recipient, (jid) => webhookAudio(sockContainer.sock, jid, audio));
        res.status(200).json({ status: 'successful', message: 'Audio sent' });
    } catch (err) {
        console.error('[WEBHOOK] Audio webhook error:', err);
        res.status(500).json({ status: 'failed', message: 'Internal error' });
    }
};

const sendVideoWebhook = async (sockContainer, body, res) => {
    const { recipient, video, data } = body;
    try {
        await sendWithDelay(recipient, (jid) => webhookVideo(sockContainer.sock, jid, video, data));
        res.status(200).json({ status: 'successful', message: 'Video sent' });
    } catch (err) {
        console.error('[WEBHOOK] Video webhook error:', err);
        res.status(500).json({ status: 'failed', message: 'Internal error' });
    }
};

const sendLocationWebhook = async (sockContainer, body, res) => {
    const { recipient, location } = body;
    try {
        await sendWithDelay(recipient, (jid) => webhookLocation(sockContainer.sock, jid, location));
        res.status(200).json({ status: 'successful', message: 'Location sent' });
    } catch (err) {
        console.error('[WEBHOOK] Location webhook error:', err);
        res.status(500).json({ status: 'failed', message: 'Internal error' });
    }
};

module.exports = {
    sendTextWebhook,
    sendImageWebhook,
    sendAudioWebhook,
    sendVideoWebhook,
    sendLocationWebhook
};
