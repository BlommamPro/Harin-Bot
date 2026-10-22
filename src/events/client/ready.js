import { config } from '../../../config/config.js';
import { logger } from '../../utils/logger.js';
import { startGiveawayChecker } from '../../utils/giveawayHandler.js';
import { setSupportChannel } from '../../utils/anticrash.js';
import { setSupportChannelForErrors } from '../interaction/interactionCreate.js';
import { startStatusRotation } from '../../utils/statusRotator.js';

export default {
  name: 'clientReady',
  once: true,

  async execute(client) {
    startStatusRotation(client);

    logger.success(`${client.user.tag} está online en ${client.guilds.cache.size} servidores`);
    logger.info(`📊 ${client.users.cache.size} usuarios | ${client.channels.cache.size} canales`);

    startGiveawayChecker(client);

    if (config.supportChannelId) {
      try {
        const channel = await client.channels.fetch(config.supportChannelId);
        if (channel) {
          setSupportChannel(channel);
          setSupportChannelForErrors(channel);
          logger.success(`Canal de soporte configurado: #${channel.name}`);
        }
      } catch (err) {
        logger.warn('No pude obtener el canal de soporte:', err.message);
      }
    }
  },
};