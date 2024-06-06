const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

// Estructura para almacenar la cola de canciones y el estado del reproductor por servidor
const queues = new Map();

module.exports = {
    async play(interaction, url) {
        const guildId = interaction.guild.id;
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply('¡Necesitas estar en un canal de voz para reproducir música!');
        }

        // Obtén la cola del servidor actual o crea una nueva
        const queue = queues.get(guildId) || { songs: [], connection: null, player: createAudioPlayer() };

        // Manejo de la conexión al canal de voz
        if (!queue.connection) {
            queue.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            queue.connection.subscribe(queue.player);

            // Manejador de eventos cuando la canción termina
            queue.player.on(AudioPlayerStatus.Idle, () => {
                queue.songs.shift();
                if (queue.songs.length > 0) {
                    this._playNextSong(queue);
                } else {
                    queue.connection.destroy();
                    queues.delete(guildId);
                }
            });

            // Manejo de errores en la conexión
            queue.connection.on(VoiceConnectionStatus.Disconnected, () => {
                queue.connection.destroy();
                queues.delete(guildId);
            });
        }

        // Añadir canciones a la cola (soporte para listas de reproducción)
        if (ytpl.validateID(url)) {
            const playlist = await ytpl(url, { pages: 1 });
            playlist.items.forEach(item => queue.songs.push(item.url_simple));
            interaction.reply(`Añadiendo la lista de reproducción: **${playlist.title}** con ${playlist.items.length} canciones a la cola.`);
        } else {
            // Añadir una sola canción
            queue.songs.push(url);
            interaction.reply(`Añadiendo canción: ${url} a la cola.`);
        }

        // Si no se está reproduciendo nada, iniciar la reproducción
        if (queue.songs.length === 1) {
            this._playNextSong(queue);
        }

        // Guardar la cola en la estructura global
        queues.set(guildId, queue);
    },

    stop(interaction) {
        const guildId = interaction.guild.id;
        const queue = queues.get(guildId);

        if (!queue) {
            return interaction.reply('No hay ninguna canción en reproducción.');
        }

        queue.songs = [];
        queue.player.stop(true); // Detener el reproductor
        queue.connection.destroy();
        queues.delete(guildId);

        interaction.reply('Música detenida y bot desconectado.');
    },

    skip(interaction) {
        const guildId = interaction.guild.id;
        const queue = queues.get(guildId);

        if (!queue || queue.songs.length === 0) {
            return interaction.reply('No hay ninguna canción en reproducción.');
        }

        queue.player.stop(); // Detener la canción actual, lo que automáticamente desencadenará la reproducción de la siguiente

        interaction.reply('Canción saltada.');
    },

    // Función privada para reproducir la siguiente canción en la cola
    _playNextSong(queue) {
        if (queue.songs.length === 0) return;

        const songUrl = queue.songs[0];
        const resource = createAudioResource(ytdl(songUrl, { filter: 'audioonly' }));
        queue.player.play(resource);
    }
};
