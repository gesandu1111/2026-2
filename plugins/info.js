module.exports = {
    pattern: 'info',
    description: 'Bot info',
    ownerOnly: false,
    function: async (sock, mek, m, { reply }) => {
        reply('Bot Name: GESANDU-MD\nOwner: ' + (process.env.OWNER_NUM || '94712345678'));
    }
};
