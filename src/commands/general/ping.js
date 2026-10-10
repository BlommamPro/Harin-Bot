import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { emojis } from '../../utils/emojis.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: false,
  NSFW: false,

  async execute(client, interaction, guildData, userData) {
    await interaction.reply({ content: `${emojis.pingconnetion} Calculando ${emojis.load}` });
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = createEmbed({
      title: '🏓 Pong!',
      description: [
        `📡 **API:** \`${client.ws.ping}ms\``,
        `⏱️ **Latencia:** \`${latency}ms\``
      ].join('\n')
    });

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};