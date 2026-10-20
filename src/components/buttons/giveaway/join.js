import { MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { joinGiveaway, updateGiveawayEmbed } from '../../../utils/giveawayHandler.js';
import { Giveaway } from '../../../models/Giveaway.js';
import { getGuildLevel, getLevelConfig } from '../../../utils/levelSystem.js';
import { getUserData } from '../../../utils/guildData.js';

export default {
  customId: 'giveaway_join_{}',

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

    const member = interaction.member;

    const errors = [];

    if (gw.requiredRoleId && !member.roles.cache.has(gw.requiredRoleId)) {
      errors.push(`Necesitas el rol <@&${gw.requiredRoleId}> para participar.`);
    }

    if (gw.requiredLevel) {
      let userLevel = 0;
      const levelType = gw.requiredLevelType || 'guild';

      if (levelType === 'guild') {
        const levelConfig = await getLevelConfig(interaction.guildId);
        if (!levelConfig.enabled) {
          errors.push('El sistema de niveles del servidor está desactivado.');
        }
        const gld = await getGuildLevel(interaction.guildId, interaction.user.id);
        userLevel = gld.level;
      } else {
        const data = await getUserData(interaction.user.id);
        userLevel = data.level || 1;
      }

      if (userLevel < gw.requiredLevel) {
        const label = levelType === 'global' ? 'global' : 'de servidor';
        errors.push(`Necesitas nivel ${label} **${gw.requiredLevel}** (tienes **${userLevel}**).`);
      }
    }

    if (errors.length > 0) {
      return interaction.reply({
        embeds: [errorEmbed(errors.join('\n'))],
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = await joinGiveaway(giveawayId, interaction.user.id);

    if (!result.ok) {
      if (result.reason === 'already_in') {
        return interaction.reply({
          embeds: [errorEmbed('Ya estás participando en este sorteo.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [errorEmbed('No se pudo completar la acción.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await interaction.message.react('🎉');
    } catch { /* ignorar */ }

    await updateGiveawayEmbed(interaction.message, giveawayId, { force: true });

    return interaction.reply({
      embeds: [successEmbed(`¡Estás participando en el sorteo de **${gw.prize}**!`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};