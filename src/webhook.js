const { Mimetype } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function webhookText(sock, sender, text) {
    try {
        await sock.sendMessage(sender, { text: text });
        const phoneNumber = sender.split('@')[0];
        console.log(`[WEBHOOK] Successful: ${phoneNumber} - ${text}`);
    } catch (error) {
        console.error('[WEBHOOK] Failed to forward data:', error);
        throw error;
    }
}

async function webhookImage(sock, sender, imageUrl, caption) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        
        await sock.sendMessage(sender, { image: imageBuffer, caption: caption });
        
        const phoneNumber = sender.split('@')[0];
        console.log(`[WEBHOOK] Successful: ${phoneNumber} - Image sent with caption: ${caption}`);
    } catch (error) {
        console.error('[WEBHOOK] Failed to forward image:', error);
        throw error;
    }
}

async function webhookAudio(sock, sender, audioUrl) {
    try {
        const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(response.data, 'binary');

        await sock.sendMessage(sender, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: false
        });

        const phoneNumber = sender.split('@')[0];
        console.log(`[WEBHOOK] Successful: ${phoneNumber} - Audio sent`);
    } catch (error) {
        console.error('[WEBHOOK] Failed to forward audio:', error);
        throw error;
    }
}

async function webhookVideo(sock, sender, videoUrl, caption) {
    try {
        const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        const videoBuffer = Buffer.from(response.data, 'binary');

        await sock.sendMessage(sender, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: caption
        });

        const phoneNumber = sender.split('@')[0];
        console.log(`[WEBHOOK] Successful: ${phoneNumber} - Video sent with caption: ${caption}`);
    } catch (error) {
        console.error('[WEBHOOK] Failed to forward video:', error);
        throw error;
    }
}

async function webhookLocation(sock, sender, location) {
    try {
        const [latitude, longitude] = location.split(',');

        await sock.sendMessage(sender, {
            location: {
                degreesLatitude: parseFloat(latitude),
                degreesLongitude: parseFloat(longitude)
            }
        });

        const phoneNumber = sender.split('@')[0];
        console.log(`[WEBHOOK] Successful: ${phoneNumber} - Location sent`);
    } catch (error) {
        console.error('[WEBHOOK] Failed to forward location:', error);
        throw error;
    }
}

module.exports = { webhookText, webhookImage, webhookAudio, webhookVideo, webhookLocation };
