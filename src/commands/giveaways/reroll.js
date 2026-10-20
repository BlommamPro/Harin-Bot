import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { rerollGiveaway } from '../../utils/giveawayHandler.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('giveaway-reroll')
    .setDescription('Elige un nuevo ganador de un sorteo terminado')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID del sorteo').setRequired(true)
    ),

  PERMISSIONS: ['ManageEvents'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const id = interaction.options.getString('id').toUpperCase();
    const winner = await rerollGiveaway(id, interaction.guildId);

    if (!winner) {
      return interaction.reply({
        embeds: [errorEmbed('No encontré ese sorteo terminado en este servidor.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const description = block([
      kv('ID', `\`${id}\``),
      kv('Ganador', `<@${winner}>`),
    ]);

    const embed = createEmbed({
      color: COLORS.SUCCESS,
      title: '🔁 Nuevo ganador',
      description,
    });

    await interaction.reply({
      embeds: [embed],
      content: `<@${winner}>`,
    });
  },
};