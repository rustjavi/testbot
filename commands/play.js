const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

module.exports = {
    data: {
        name: 'play',
        description: 'Reproduce una canción o una lista de reproducción desde YouTube',
        options: [
            {
                name: 'url',
                type: 'STRING',
                description: 'La URL del video o la lista de reproducción de YouTube',
                required: true,
            },
        ],
    },
    async execute(interaction) {
        const url = interaction.options.getString('url');
        
        // Validar si la URL es válida
        if (!ytdl.validateURL(url) && !ytpl.validateID(url)) {
            return interaction.reply('Por favor, proporciona una URL válida de YouTube o una lista de reproducción.');
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply('¡Necesitas estar en un canal de voz para reproducir música!');
        }

        // Unirse al canal de voz
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        let songs = [];

        // Si es una lista de reproducción
        if (ytpl.validateID(url)) {
            const playlist = await ytpl(url, { pages: 1 }); // Limitar a 1 página por simplicidad
            songs = playlist.items.map(item => item.url_simple);
            await interaction.reply(`Reproduciendo la lista de reproducción: **${playlist.title}**`);
        } else {
            // Si es un video individual
            songs.push(url);
            await interaction.reply(`Reproduciendo: ${url}`);
        }

        // Función para reproducir una canción
        const playSong = (url) => {
            const resource = createAudioResource(ytdl(url, { filter: 'audioonly' }));
            player.play(resource);
        };

        // Reproducir la primera canción
        playSong(songs.shift());

        // Evento cuando la canción termina
        player.on(AudioPlayerStatus.Idle, () => {
            if (songs.length > 0) {
                playSong(songs.shift());
            } else {
                connection.destroy(); // Desconectar después de la reproducción
            }
        });

        // Manejo de errores
        player.on('error', error => {
            console.error('Error en el reproductor de audio:', error);
            interaction.followUp({ content: 'Ocurrió un error durante la reproducción de la canción.' });
        });
    },
};
