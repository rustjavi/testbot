const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: {
        name: 'skip',
        description: 'Salta la canción actual',
    },
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
            const player = connection.state.subscription.player;
            player.stop();
            await interaction.reply('Canción saltada.');
        } else {
            await interaction.reply('No hay ninguna canción en reproducción.');
        }
    },
};
