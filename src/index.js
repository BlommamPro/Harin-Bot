import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { config } from "../config/config.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadComponents } from "./handlers/componentHandler.js";
import { connectDB } from "./utils/database.js";
import { logger } from "./utils/logger.js";
import { setupProcessHandlers } from "./utils/anticrash.js";
import { setupDBShutdown } from './utils/database.js';
import { cleanupExpiredEvents, refreshActiveEvents } from "./utils/eventManager.js";
import { sweepOldGames } from "./utils/blackjackStore.js";

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

  try {
    const cleaned = await cleanupExpiredEvents();
    if (cleaned > 0) logger.info(`Eventos expirados cerrados al arrancar: ${cleaned}`);
    await refreshActiveEvents();
  } catch (err) {
    logger.warn('No pude limpiar/refrescar eventos al arrancar:', err.message);
  }

  setInterval(() => {
    cleanupExpiredEvents().catch(err =>
      logger.warn('Error en limpieza periódica de eventos:', err.message)
    );
  }, 5 * 60_000);

  setInterval(() => {
    try {
      sweepOldGames(20 * 60 * 1000);
    } catch (err) {
      logger.warn('Error en limpieza periódica de partidas de blackjack:', err.message);
    }
  }, 5 * 60_000);

  await loadEvents(client);
  await loadCommands(client);
  await loadComponents(client);

  client.login(config.token).catch((err) => {
    logger.error("Error al iniciar sesión:", err);
    process.exit(1);
  });
}

start();