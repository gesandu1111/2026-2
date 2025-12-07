// plugins/download-viewonce.js
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

module.exports = {
    pattern: 'v1',
    description: 'Download View Once photo/video and send back',
    ownerOnly: false,
    alias: ['viewonce'],

    function: async (sock, mek, m, { reply }) => {
        const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return reply('❌ Reply to a View Once photo/video message.');

        const type = getContentType(quoted);

        // Check if it's viewOnce
        let messageContent = quoted;
        if (quoted.viewOnceMessage) {
            messageContent = quoted.viewOnceMessage.message;
        } else {
            return reply('❌ This is not a View Once message.');
        }

        const mediaType = getContentType(messageContent);
        if (!['imageMessage','videoMessage'].includes(mediaType)) {
            return reply('❌ Only View Once photo/video supported.');
        }

        try {
            const stream = await downloadContentFromMessage(messageContent, mediaType.replace('Message','').toLowerCase());
            const buffer = [];
            for await (const chunk of stream) buffer.push(chunk);
            const data = Buffer.concat(buffer);

            // Send back to user
            if (mediaType === 'imageMessage') {
                await sock.sendMessage(mek.key.remoteJid, { image: data, caption: '📥 View Once Photo!' }, { quoted: mek });
            } else if (mediaType === 'videoMessage') {
                await sock.sendMessage(mek.key.remoteJid, { video: data, caption: '📥 View Once Video!' }, { quoted: mek });
            }

        } catch (err) {
            console.error(err);
            reply('❌ Could not download View Once media.');
        }
    }
};
