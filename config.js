// config.js
const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    OWNER_NUM: process.env.OWNER_NUM ? process.env.OWNER_NUM.split(',') : ['94712345678'],
    PREFIX: process.env.PREFIX || '.',
    SESSION_NAME: process.env.SESSION_NAME || 'GESANDU-MD',
    PORT: process.env.PORT || '5000',
    OWNER_ONLY: convertToBool(process.env.OWNER_ONLY || 'false'),
    SELF_MODE: convertToBool(process.env.SELF_MODE || 'false'),
    AUTO_READ_MESSAGES: convertToBool(process.env.AUTO_READ_MESSAGES || 'false'),
};
