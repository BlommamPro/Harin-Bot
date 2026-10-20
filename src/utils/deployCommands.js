import { REST, Routes } from 'discord.js';
import { config } from '../../config/config.js';
import { loadCommandsForDeploy, loadContextMenusForDeploy } from '../handlers/commandHandler.js';
import { logger } from './logger.js';

const timeout = setTimeout(() => {
  logger.warn('Forzando cierre del deploy por timeout de seguridad (5 min)...');
  process.exit(0);
}, 300000);

(async () => {
  try {
    const commands = [];
    const contextMenus = [];

    const slashCmds = await loadCommandsForDeploy();
    slashCmds.forEach(cmd => {
      const json = cmd.CMD.toJSON();
      const allowUserInstall = cmd.GUILD_ONLY === false;

      json.integration_types = allowUserInstall ? [0, 1] : [0];
      json.contexts = allowUserInstall ? [0, 1, 2] : [0];

      if (cmd.OWNER === true) {
        json.default_member_permissions = '0';
      }

      commands.push(json);
    });

    const ctxMenus = await loadContextMenusForDeploy();
    ctxMenus.forEach(menu => {
      const json = menu.CMD.toJSON();
      const allowUserInstall = menu.GUILD_ONLY === false;

      json.integration_types = allowUserInstall ? [0, 1] : [0];
      json.contexts = allowUserInstall ? [0, 1, 2] : [0];

      if (menu.OWNER === true) {
        json.default_member_permissions = '0';
      }

      contextMenus.push(json);
    });

    const allCommands = [...commands, ...contextMenus];

    const rest = new REST({
      version: '10',
      timeout: 120000,
      retries: 3,
    }).setToken(config.token);

    logger.info(`Deployando ${allCommands.length} comandos... (puede tardar varios minutos si Discord esta lento)`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    const data = await rest.put(route, { body: allCommands });

    clearTimeout(timeout);

    logger.success(`✅ ${data.length} comandos deployados correctamente.`);
    logger.info(`Modo: ${config.guildId ? 'Guild (instantaneo)' : 'Global (hasta 1h)'}`);
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);
    logger.error('Error deployando comandos:', err.message || err);
    process.exit(1);
  }
})();