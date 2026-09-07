import { Giveaway } from '../../models/Giveaway.js';
import { addParticipant, updateGiveawayEmbed } from '../../utils/giveawayHandler.js';
import { getGuildLevel } from '../../utils/levelSystem.js';
import { getUserData } from '../../utils/guildData.js';
import { getLevelConfig } from '../../utils/levelSystem.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'messageReactionAdd',
  once: false,

  async execute(client, reaction, user) {
    try {
      if (user.bot) return;
      if (reaction.emoji.name !== '🎉') return;

      const message = reaction.message;
      if (!message.guild) return;

      if (!message.id) return;

      const gw = await Giveaway.findOne({
        messageId: message.id,
        ended: false
      });

      if (!gw) return;

      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }

      const errors = [];

      if (gw.requiredRoleId) {
        if (!member.roles.cache.has(gw.requiredRoleId)) {
          errors.push(`❌ Necesitas el rol <@&${gw.requiredRoleId}> para participar.`);
        }
      }

      if (gw.requiredLevel) {
        let userLevel = 0;
        let levelType = gw.requiredLevelType || 'guild';
        let levelConfig = null;

        if (levelType === 'guild') {
          const guildLevel = await getGuildLevel(message.guildId, user.id);
          userLevel = guildLevel.level;
          levelConfig = await getLevelConfig(message.guildId);
          
          if (!levelConfig.enabled) {
            errors.push(`❌ El sistema de niveles del servidor está desactivado.`);
          }
        } else {
          const userData = await getUserData(user.id);
          userLevel = userData.level || 1;
        }

        if (userLevel < gw.requiredLevel) {
          const levelLabel = levelType === 'global' ? 'Global' : 'Servidor';
          errors.push(`❌ Necesitas nivel ${levelLabel} **${gw.requiredLevel}** (tu nivel: **${userLevel}**).`);
        }
      }

      if (errors.length > 0) {
        await reaction.users.remove(user.id).catch(() => {});
        
        try {
          const errorMessage = errors.join('\n');
          await user.send({
            content: `❌ **No puedes participar en este sorteo:**\n${errorMessage}`
          }).catch(() => {});
        } catch { /* ignorar */ }
        
        return;
      }

      const added = await addParticipant(gw.giveawayId, user.id);
      
      if (added) {
        await updateGiveawayEmbed(message, gw.giveawayId);
      }
    } catch (error) {
      logger.warn('Error en messageReactionAdd:', error.message);
    }
  }
};