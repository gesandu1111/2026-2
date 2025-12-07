// plugins/send.js
const axios = require('axios');

module.exports = {
    pattern: 'send', // command trigger
    description: 'Send photo/video/doc from URL',
    alias: [],       // optional alternative triggers
    ownerOnly: false, // true නම් only owner can use

    function: async (sock, mek, m, { args, reply }) => {
        const url = args[0];
        if (!url) return reply("❗ Provide a URL. Example: `.send https://example.com/file.jpg`");
        if (!/^https?:\/\//i.test(url)) return reply("❗ URL must start with http:// or https://");

        try {
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" }});
            const mime = res.headers['content-type'] || 'application/octet-stream';
            const buffer = Buffer.from(res.data);

            // Image
            if (mime.startsWith('image')) {
                await sock.sendMessage(mek.key.remoteJid, { image: buffer, mimetype: mime, caption: '📩 Sent!' }, { quoted: mek });
            }
            // Video
            else if (mime.startsWith('video')) {
                await sock.sendMessage(mek.key.remoteJid, { video: buffer, mimetype: mime, caption: '📩 Sent!' }, { quoted: mek });
            }
            // Documents / other files
            else {
                await sock.sendMessage(mek.key.remoteJid, { document: buffer, mimetype: mime, fileName: 'file' }, { quoted: mek });
            }
        } catch (err) {
            console.error(err);
            reply("❌ Could not download/send file. Check URL.");
        }
    }
};
