module.exports = {
    pattern: 'time',
    description: 'Show current server time',
    ownerOnly: false,
    function: async (sock, mek, m, { reply }) => {
        reply('Current time: ' + new Date().toLocaleString());
    }
};
