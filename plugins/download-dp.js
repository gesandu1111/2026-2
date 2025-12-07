// plugins/download-dp.js
const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    pattern: 'dp',
    description: 'Download WhatsApp profile picture of user or group',
    ownerOnly: false,
    alias: ['avatar', 'profile'],

    function: async (sock, mek, m, { args, reply }) => {
        const from = mek.key.remoteJid;
        let jid = from;

        // If replied to someone, get their jid
        if (mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            jid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            // if user provides phone number
            jid = args[0].includes('@s.whatsapp.net') ? args[0] : args[0] + '@s.whatsapp.net';
        }

        try {
            const url = await sock.profilePictureUrl(jid, 'image');
            if (!url) return reply('❌ DP not found or user has no profile picture.');

            const res = await fetch(url);
            const buffer = Buffer.from(await res.arrayBuffer());
            const fileName = path.join('./downloads', `${jid.replace('@s.whatsapp.net','')}_dp.jpg`);

            fs.mkdirSync('./downloads', { recursive: true });
            fs.writeFileSync(fileName, buffer);

            await sock.sendMessage(from, { image: buffer, caption: '📥 DP downloaded!' }, { quoted: mek });
        } catch (err) {
            console.error(err);
            reply('❌ Could not download DP.');
        }
    }
};
