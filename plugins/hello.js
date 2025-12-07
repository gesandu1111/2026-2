module.exports = {
    pattern: 'hello',
    alias: ['hi'],
    description: 'Greets the user',
    ownerOnly: false,
    function: async (sock, mek, m, { reply }) => {
        reply('Hello! I am your WhatsApp bot 🤖');
    }
};
