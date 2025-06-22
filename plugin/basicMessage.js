module.exports = async (sock, message, msg, sender) => {
    const id = message.key.remoteJid;
    const participant = message.key.participant || sender;
    const username = participant.split('@')[0];

    const isOnlyMessageContextInfo = (
        message.message &&
        Object.keys(message.message).length === 1 &&
        message.message.messageContextInfo
    );

    if (!msg && isOnlyMessageContextInfo) {
        try {
            const metadata = await sock.groupMetadata(id);
            const admins = metadata.participants.filter(
                (p) => p.admin === 'admin' || p.admin === 'superadmin'
            );
            const adminMentions = admins.map((a) => a.id);
            const senderMention = `@${username}`;
            const adminNames = admins.map((a) => '@' + a.id.split('@')[0]).join('\n');

            const replyText =
                `${senderMention} telah terdeteksi melakukan penandaan grup ini pada statusnya!\n\n` +
                `${adminNames}`;

            const mentions = [participant, ...adminMentions];

            await sock.sendMessage(id, {
                text: replyText,
                mentions: mentions,
            });
        } catch (err) {
            console.error("Gagal memproses metadata:", err.message);
        }
    }
};

module.exports.SELF = false;
