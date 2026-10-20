import { Giveaway } from '../../models/Giveaway.js';
import {
  joinGiveaway,
  leaveGiveaway,
  updateGiveawayEmbed,
} from '../../utils/giveawayHandler.js';
import { getGuildLevel, getLevelConfig } from '../../utils/levelSystem.js';
import { getUserData } from '../../utils/guildData.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'messageReactionAdd',
  once: false,

  async execute(client, reaction, user) {
    try {
      if (user.bot) return;

      const emoji = reaction.emoji.name;
      if (emoji !== '🎉' && emoji !== '❌') return;

      const message = reaction.message.partial
        ? await reaction.message.fetch().catch(() => null)
        : reaction.message;
      if (!message || !message.guild) return;

      const gw = await Giveaway.findOne({ messageId: message.id, ended: false });
      if (!gw) return;

      if (emoji === '❌') {
        const result = await leaveGiveaway(gw.giveawayId, user.id);

        await reaction.users.remove(user.id).catch(() => {});

        if (result.ok) {
          await updateGiveawayEmbed(message, gw.giveawayId, { force: true });
        }
        return;
      }

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }

      const errors = [];

      if (gw.requiredRoleId && !member.roles.cache.has(gw.requiredRoleId)) {
        errors.push(`Necesitas el rol <@&${gw.requiredRoleId}>.`);
      }

      if (gw.requiredLevel) {
        let userLevel = 0;
        const levelType = gw.requiredLevelType || 'guild';

        if (levelType === 'guild') {
          const levelConfig = await getLevelConfig(message.guild.id);
          if (!levelConfig.enabled) {
            errors.push('El sistema de niveles del servidor está desactivado.');
          }
          const gld = await getGuildLevel(message.guild.id, user.id);
          userLevel = gld.level;
        } else {
          const data = await getUserData(user.id);
          userLevel = data.level || 1;
        }

        if (userLevel < gw.requiredLevel) {
          const label = levelType === 'global' ? 'global' : 'de servidor';
          errors.push(`Necesitas nivel ${label} **${gw.requiredLevel}** (tienes **${userLevel}**).`);
        }
      }

      if (errors.length > 0) {
        await reaction.users.remove(user.id).catch(() => {});
        try {
          await user.send({
            content: `❌ **No puedes participar en este sorteo:**\n${errors.join('\n')}`,
          }).catch(() => {});
        } catch { /* ignorar */ }
        return;
      }

      const result = await joinGiveaway(gw.giveawayId, user.id);
      if (result.ok) {
        await updateGiveawayEmbed(message, gw.giveawayId, { force: true });
      }
    } catch (error) {
      logger.warn('Error en messageReactionAdd:', error.message);
    }
  },
};