const CONFIG = require('../config/config');

async function groupParticipantUpdate(sock, event) {
    const { id, participants, action } = event;
    if (!id || !participants || !action) {
        return;
    }

    if (!CONFIG.GROUP_GREETING) {
        return;
    }

    const participant = participants[0];
    const participantId = participant.split('@')[0];

    if (action === 'add') {
        try {
            const welcomeMessage = `*Welcome* @${participantId} to the group! 🎉`;
            await sock.sendMessage(id, { text: welcomeMessage, mentions: [participant] });
        } catch (error) {
            console.error('[GROUP] Failed to send welcome message:', error);
        }
    }

    if (action === 'remove') {
        try {
            const goodbyeMessage = `*Goodbye* @${participantId}, we will miss you! 😢`;
            await sock.sendMessage(id, { text: goodbyeMessage, mentions: [participant] });
        } catch (error) {
            console.error('[GROUP] Failed to send goodbye message:', error);
        }
    }
}

module.exports = { groupParticipantUpdate };
