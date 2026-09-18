import dotenv from "dotenv";
dotenv.config();

import { COLORS } from "../src/utils/embedColors.js";

export const config = {
  env: process.env.ENV || "production",
  isDev: process.env.ENV === "development",

  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  mongoURL: process.env.MONGO_URL,

  ownerIds: process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(/[ ,]+/).filter((id) => id.trim())
    : [],

  color: COLORS.DEFAULT,
  errorColor: COLORS.ERROR,
  cooldownColor: COLORS.WARNING,

  status: process.env.STATUS || "online",
  activity: {
    type: process.env.ACTIVITY_TYPE || "Playing",
    name: process.env.ACTIVITY_NAME || "EstrellaStudios ⭐",
  },

  supportChannelId: process.env.SUPPORT_CHANNEL_ID || null,
};