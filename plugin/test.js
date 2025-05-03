module.exports = async (sock, message, msg, sender) => {
    const messageBody = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

    const blockWords = [
		'bit.ly', 't.me', 'chat.whatsapp.com', 'tai', 'goblok', 'kontol', 'babi', 'anjing', 'memek', 'sialan', 'pecah', 'setan'
	];

    const containsBlockWords = (text) => {
        return blockWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
    };

    const remoteJid = message.key?.remoteJid;
    const messageKey = message.key;

    if (remoteJid && containsBlockWords(messageBody)) {
        try {
            await sock.sendMessage(remoteJid, { delete: messageKey });
        } catch (error) {
            console.error('Gagal menghapus pesan:', error);
        }
    }
};

module.exports.SELF = false;