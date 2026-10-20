import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { endGiveaway } from '../../utils/giveawayHandler.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('Termina un sorteo manualmente')
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
    const result = await endGiveaway(client, id, interaction.guildId);

    if (!result) {
      return interaction.reply({
        embeds: [errorEmbed('No encontré ese sorteo activo en este servidor.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const winners = result.winners.length > 0
      ? result.winners.map(w => `<@${w}>`).join(', ')
      : '`Nadie`';

    const description = block([
      kv('ID', `\`${id}\``),
      kv('Ganadores', winners),
      kv('Participantes', `\`${result.participants.length}\``),
    ]);

    const embed = createEmbed({
      color: COLORS.SUCCESS,
      title: '🏁 Sorteo finalizado',
      description,
    });

    await interaction.reply({ embeds: [embed] });
  },
};