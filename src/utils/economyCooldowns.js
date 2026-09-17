import { User } from '../models/User.js';

export async function checkDbCooldown(userId, commandName, cooldownMinutes) {
  const user = await User.findOne({ userId }).select(`cooldowns.${commandName}`).lean();
  const lastUsed = user?.cooldowns?.[commandName];

  if (!lastUsed) {
    return { onCooldown: false, timeLeft: 0, nextTimestamp: 0 };
  }

  const lastTime = new Date(lastUsed).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const nextUse = lastTime + cooldownMs;

  if (Date.now() < nextUse) {
    const timeLeftSec = Math.ceil((nextUse - Date.now()) / 1000);
    return {
      onCooldown: true,
      timeLeft: timeLeftSec,
      nextTimestamp: Math.floor(nextUse / 1000)
    };
  }

  return { onCooldown: false, timeLeft: 0, nextTimestamp: 0 };
}

export async function setDbCooldown(userId, commandName) {
  await User.updateOne(
    { userId },
    {
      $set: { [`cooldowns.${commandName}`]: new Date() },
      $setOnInsert: { userId }
    },
    { upsert: true }
  );
}