const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: {
        name: 'stop',
        description: 'Detiene la reproducción y desconecta el bot',
    },
    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
            connection.destroy();
            await interaction.reply('¡Música detenida y bot desconectado!');
        } else {
            await interaction.reply('El bot no está en un canal de voz.');
        }
    },
};
