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
    rotate: true,
    intervalMs: 20 * 60_000,
    list: [
      { type: "Playing",   name: "EstrellaStudios ⭐" },
      { type: "Playing",   name: "/help" },
      { type: "Watching",  name: "{servers} servidores" },
      { type: 'Competing', name: '𝓗𝓪𝓻𝓲𝓷 𝓑𝓸𝓽' },
    ],
  },

  supportChannelId: process.env.SUPPORT_CHANNEL_ID || null,
};