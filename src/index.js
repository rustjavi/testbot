require('dotenv').config();
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Crear un nuevo cliente de Discord con las intenciones necesarias
const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT
    ]
});

const app = express();
const port = 3000;
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});
app.listen(port, () => {
  console.log(`🔗 Listening to GlaceYT : http://localhost:${port}`);
});

// Colección para comandos
client.commands = new Collection();

// Leer todos los archivos de comandos en la carpeta 'commands'
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Establece un nuevo comando en la colección con la clave como el nombre del comando y el valor como el módulo exportado
    client.commands.set(command.data.name, command);
}

// Evento cuando el bot se conecta
client.once('ready', () => {
    console.log(`Conectado como ${client.user.tag}`);
});

// Evento de interacción para manejar los comandos slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Hubo un error al ejecutar este comando!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
