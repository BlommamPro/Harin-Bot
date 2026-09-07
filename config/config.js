import dotenv from "dotenv";
dotenv.config();

export const config = {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoURL: process.env.MONGO_URL,

  language: process.env.LANGUAGE || "es",
  color: parseInt(process.env.COLOR?.replace('#', ''), 16) || 0xfcc706,
  errorColor: parseInt(process.env.ERROR_COLOR?.replace('#', ''), 16) || 0xED4245,
  cooldownColor: parseInt(process.env.COOLDOWN_COLOR?.replace('#', ''), 16) || 0xf3a0fc,
  ownerIds: process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(/[ ,]+/).filter((id) => id.trim())
    : [],

  status: process.env.STATUS || "online",
  activity: {
    type: process.env.ACTIVITY_TYPE || "Playing",
    name: process.env.ACTIVITY_NAME || "EstrellaStudios ⭐",
  },

  supportChannelId: process.env.SUPPORT_CHANNEL_ID || null,
};