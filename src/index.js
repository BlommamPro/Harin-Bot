import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { config } from "../config/config.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadComponents } from "./handlers/componentHandler.js";
import { connectDB } from "./utils/database.js";
import { logger } from "./utils/logger.js";
import { setupProcessHandlers } from "./utils/anticrash.js";
import { setupDBShutdown } from './utils/database.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction,
  ],
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
});

client.slashCommands = new Collection();
client.contextMenus = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.cooldowns = new Collection();

async function start() {
  setupProcessHandlers(client);

  if (config.mongoURL) {
    await connectDB();
    setupDBShutdown(client);
  }

  await loadEvents(client);
  await loadCommands(client);
  await loadComponents(client);

  client.login(config.token).catch((err) => {
    logger.error("Error al iniciar sesión:", err);
    process.exit(1);
  });
}

start();