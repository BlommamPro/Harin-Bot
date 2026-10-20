import { MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { leaveGiveaway, updateGiveawayEmbed } from '../../../utils/giveawayHandler.js';
import { Giveaway } from '../../../models/Giveaway.js';

export default {
  customId: 'giveaway_leave_{}',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 2,

  async execute(client, interaction, args) {
    const giveawayId = args[0];
    if (!giveawayId) {
      return interaction.reply({
        embeds: [errorEmbed('Sorteo no encontrado.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const gw = await Giveaway.findOne({ giveawayId, ended: false });
    if (!gw) {
      return interaction.reply({
        embeds: [errorEmbed('Ese sorteo ya no está activo.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = await leaveGiveaway(giveawayId, interaction.user.id);

    if (!result.ok) {
      return interaction.reply({
        embeds: [errorEmbed(
          result.reason === 'not_in'
            ? 'No estás participando en este sorteo.'
            : 'No se pudo completar la acción.'
        )],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const reaction = interaction.message.reactions.cache.get('🎉');
      if (reaction) await reaction.users.remove(interaction.user.id);
    } catch { /* ignorar */ }

    await updateGiveawayEmbed(interaction.message, giveawayId, { force: true });

    return interaction.reply({
      embeds: [successEmbed(`Has salido del sorteo de **${gw.prize}**.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};