import { getGuildData, getUserData, updateUserData } from '../../utils/guildData.js';
import { addGuildXp, getLevelConfig, getXpForLevel } from '../../utils/levelSystem.js';
import { User } from '../../models/User.js';
import { logger } from '../../utils/logger.js';

const MIN_XP = 15;
const MAX_XP = 25;

const globalXpCooldowns = new Map();
const guildXpCooldowns = new Map();

function getXpForGlobalLevel(level) {
  return level * level * 100;
}

async function awardBadgeIfMissing(userId, badgeId) {
  const user = await User.findOne({ userId });
  if (!user) return false;
  if (user.badges.includes(badgeId)) return false;

  await User.updateOne(
    { userId },
    { $push: { badges: badgeId } }
  );
  return true;
}

export default {
  name: 'messageCreate',
  once: false,

  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const now = Date.now();

    if (!globalXpCooldowns.has(userId) || now - globalXpCooldowns.get(userId) > 60000) {
      globalXpCooldowns.set(userId, now);

      const userData = await getUserData(userId, message.author.username);
      const xpGain = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP;
      let newXp = (userData?.xp || 0) + xpGain;
      let newLevel = userData?.level || 1;
      let leveledUp = false;
      let safety = 0;

      while (newXp >= getXpForGlobalLevel(newLevel) && safety < 100) {
        newXp -= getXpForGlobalLevel(newLevel);
        newLevel++;
        leveledUp = true;
        safety++;
      }

      if (safety >= 100) {
        logger.warn(
          `Posible bucle infinito en addGlobalXp para ${userId} (nivel ${newLevel}). Datos posiblemente corruptos.`
        );
        return;
      }

      await updateUserData(userId, {
        $set: {
          username: message.author.username,
          xp: newXp,
          level: newLevel
        },
        $inc: { messages: 1 }
      });

      if (newLevel >= 10) await awardBadgeIfMissing(userId, 'level_10');
      if (newLevel >= 50) await awardBadgeIfMissing(userId, 'level_50');

      if (leveledUp) {
        logger.success(`${message.author.tag} subió al nivel global ${newLevel}!`);
      }
    }

    const levelConfig = await getLevelConfig(guildId);
    if (!levelConfig.enabled) return;

    if (levelConfig.ignoredChannels?.includes(message.channelId)) {
      return;
    }

    const key = `${guildId}-${userId}`;
    const cooldownMs = Math.max((levelConfig.cooldownSeconds || 60) * 1000, 5000);

    if (!guildXpCooldowns.has(key) || now - guildXpCooldowns.get(key) > cooldownMs) {
      guildXpCooldowns.set(key, now);

      const xpAmount = Math.floor(
        Math.random() * ((levelConfig.xpMax || 25) - (levelConfig.xpMin || 15) + 1)
      ) + (levelConfig.xpMin || 15);

      const result = await addGuildXp(guildId, userId, xpAmount);

      if (result.leveledUp) {
        const roleConfig = levelConfig.roles?.find(r => r.level === result.newLevel);
        if (roleConfig) {
          const member = message.member;
          if (member && !member.roles.cache.has(roleConfig.roleId)) {
            const role = message.guild.roles.cache.get(roleConfig.roleId);
            if (role && role.position < message.guild.members.me.roles.highest.position) {
              await member.roles.add(role).catch(() => {});
            }
          }
        }

        if (levelConfig.announceChannel) {
          const channel = message.guild.channels.cache.get(levelConfig.announceChannel);
          if (channel?.isTextBased()) {
            const messageTemplate = levelConfig.levelUpMessage || '🎉 ¡{user} ha subido al nivel **{level}**!';
            const finalMessage = messageTemplate
              .replace(/{user}/g, `<@${userId}>`)
              .replace(/{level}/g, result.newLevel);
            
            await channel.send(finalMessage).catch(() => {});
          }
        }

        logger.success(`${message.author.tag} subió al nivel ${result.newLevel} en ${message.guild.name}`);
      }
    }
  }
};