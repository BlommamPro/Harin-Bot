import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    await interaction.reply({ content: '📡 Calculando...' });
    const sent = await interaction.fetchReply();
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    const description = [
      header('📡', 'Latencia'),
      block([
        kv('API', `\`${client.ws.ping}ms\``),
        kv('Bot', `\`${latency}ms\``),
      ]),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.INFO,
      title: '🏓 Pong',
      description,
    });

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};