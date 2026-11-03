import { MessageFlags } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds.js';
import { getGame } from '../../../utils/blackjackStore.js';
import { resolveDealer } from '../../../commands/economy/blackjack.js';

export default {
  customId: 'bj_stand_{}_{}',
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,

  async execute(client, interaction, args) {
    const [userId, gameId] = args;

    if (interaction.user.id !== userId) {
      return interaction.reply({
        embeds: [errorEmbed('Esta partida no es tuya.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const game = getGame(gameId);
    if (!game || game.resolved) {
      return interaction.reply({
        embeds: [errorEmbed('Esta partida ya terminó o expiró.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    game.resolved = true;
    return resolveDealer(game, interaction);
  },
};