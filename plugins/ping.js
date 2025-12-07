module.exports = {
    pattern: 'ping',
    description: 'Check bot latency',
    ownerOnly: false,
    function: async (sock, mek, m, { reply }) => {
        reply('pong 🏓');
    }
};
