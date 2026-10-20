import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { Giveaway } from '../../models/Giveaway.js';
import { logger } from '../../utils/logger.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('giveaway-delete')
    .setDescription('🗑️ Cancela un sorteo sin dar ganador')
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

    const gw = await Giveaway.findOne({
      giveawayId: id,
      guildId: interaction.guildId,
      ended: false,
    });

    if (!gw) {
      return interaction.reply({
        embeds: [errorEmbed(`No encontré un sorteo activo con ID \`${id}\` en este servidor.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const channel = await interaction.guild.channels.fetch(gw.channelId).catch(() => null);
      const message = channel
        ? await channel.messages.fetch(gw.messageId).catch(() => null)
        : null;

      // Editamos el mensaje original si existe
      if (message) {
        const cancelEmbed = createEmbed({
          color: COLORS.ERROR,
          title: '🚫 Sorteo cancelado',
          description: block([
            kv('Premio', gw.prize),
            kv('ID', `\`${gw.giveawayId}\``),
            kv('Cancelado por', interaction.user.tag),
          ]),
        });

        await message.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
      }

      // Eliminamos de la DB
      await Giveaway.deleteOne({ _id: gw._id });

      logger.warn(
        `[GIVEAWAY] ${interaction.user.tag} canceló el sorteo ${id} en ${interaction.guild.name}`
      );

      const description = block([
        kv('ID', `\`${id}\``),
        kv('Premio', gw.prize),
        kv('Participantes', `\`${gw.participants.length}\``),
        kv('Cancelado por', interaction.user.tag),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🚫 Sorteo cancelado',
          description,
        })],
      });
    } catch (err) {
      logger.error('Error cancelando sorteo:', err);
      return interaction.reply({
        embeds: [errorEmbed(`No pude cancelar el sorteo: ${err.message}`)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};