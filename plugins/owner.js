module.exports = {
    pattern: 'shutdown',
    description: 'Owner only: Shutdown bot',
    ownerOnly: true,
    function: async (sock, mek, m, { reply, isOwner }) => {
        if (!isOwner) return reply('Only owner can use this!');
        reply('Shutting down...');
        process.exit(0);
    }
};
