const { 
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    getContentType
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const QRCode = require('qrcode');

const config = require('./config');

let currentQR = null;
let connectionStatus = 'disconnected';
let globalSock = null;
const commands = [];

const pluginsPath = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsPath)) {
    fs.readdirSync(pluginsPath).forEach(file => {
        if (path.extname(file) === '.js') {
            const cmd = require(path.join(pluginsPath, file));
            if (cmd && cmd.pattern) commands.push(cmd);
        }
    });
    console.log(`✅ ${commands.length} plugins loaded successfully.`);
}

const app = express();
const PORT = config.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    let qrHTML = '';
    if (connectionStatus === 'connected') {
        qrHTML = `<div style="text-align:center;color:green;"><h2>Bot Connected Successfully!</h2></div>`;
    } else if (currentQR) {
        const qrDataUrl = await QRCode.toDataURL(currentQR);
        qrHTML = `
            <div style="text-align:center;">
                <h3>Scan QR Code with WhatsApp</h3>
                <img src="${qrDataUrl}" style="width:300px;"/>
                <p>QR code expires in ~20 seconds. Refresh if needed.</p>
            </div>
        `;
    } else {
        qrHTML = `<p style="text-align:center;color:orange;">Waiting for QR...</p>`;
    }

    const html = `
    <html>
    <head><title>${config.SESSION_NAME} - WhatsApp Bot</title></head>
    <body style="font-family:sans-serif;background:#f0f0f0;padding:20px;">
        <div style="max-width:500px;margin:0 auto;background:white;padding:30px;border-radius:10px;">
            <h1>${config.SESSION_NAME}</h1>
            ${qrHTML}
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 QR Web Server running at http://0.0.0.0:${PORT}`);
});

// ===== Start Bot =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    let version;
    try {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
        console.log('📱 Using WhatsApp Web version:', version.join('.'));
    } catch {
        version = [2, 3000, 1015901307];
    }

    const sock = makeWASocket({
        auth: state,
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000
    });

    globalSock = sock;
    sock.ev.on('creds.update', saveCreds);

    if (config.AUTO_READ_MESSAGES) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            await sock.readMessages(messages.map(m => m.key));
        });
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr;
            connectionStatus = 'waiting';
            console.log('📌 QR Code received! Open browser at http://0.0.0.0:' + PORT);
        }

        if (connection === 'close') {
            connectionStatus = 'disconnected';
            currentQR = null;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('❌ Connection closed. Status Code:', statusCode);

            if (shouldReconnect) {
                console.log('🔄 Reconnecting in 10 seconds...');
                setTimeout(startBot, 10000);
            } else {
                console.log('❌ Logged out. Scan QR code again to reconnect.');
            }
        } else if (connection === 'open') {
            connectionStatus = 'connected';
            currentQR = null;
            console.log('✅ Bot connected successfully!');
        }
    });

    sock.ev.on('messages.upsert', async (meks) => {
        const mek = meks.messages[0];
        if (!mek.message) return;

        mek.message = getContentType(mek.message) === 'ephemeralMessage' ? mek.message.ephemeralMessage.message : mek.message;
        const type = getContentType(mek.message);
        const body = type === 'conversation' ? mek.message.conversation : type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text : '';
        const from = mek.key.remoteJid;
        const sender = mek.key.fromMe ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : mek.key.participant || from;
        const senderNumber = sender.split('@')[0];
        const isOwner = config.OWNER_NUM.includes(senderNumber);

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: mek });
        const isCmd = body.startsWith(config.PREFIX);
        const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);

        // ===== Plugin commands =====
        if (isCmd) {
            for (let cmd of commands) {
                if (cmd.pattern === command || (cmd.alias && cmd.alias.includes(command))) {
                    if (cmd.ownerOnly && !isOwner) return reply('Only owner can use this command!');
                    try { await cmd.function(sock, mek, {}, { reply, args, senderNumber, from, isOwner }); }
                    catch (err) { console.error('[PLUGIN ERROR]', err); reply('Error executing command.'); }
                }
            }
        }
    });
}

startBot();
