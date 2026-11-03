import { MessageFlags } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds.js';
import { getGame, deleteGame } from '../../../utils/blackjackStore.js';
import {
  handValue,
  buildGameEmbed,
  buildGameButtons,
  endGame,
  resolveDealer,
} from '../../../commands/economy/blackjack.js';

export default {
  customId: 'bj_hit_{}_{}',
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

    if (game.userId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Esta partida no es tuya.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    game.playerHand.push(game.deck.pop());
    const pVal = handValue(game.playerHand);

    if (pVal > 21) {
      game.resolved = true;
      return endGame(game, interaction, `**Te pasaste (${pVal}).** Perdiste \`${game.currentBet}\` coins.`);
    }

    if (pVal === 21) {
      game.resolved = true;
      return resolveDealer(game, interaction);
    }

    await interaction.update({
      embeds: [buildGameEmbed(game)],
      components: [buildGameButtons(game.userId, gameId, {
        canDouble: false,
        doubled: game.doubled,
        remainingBalance: game.remainingBalance,
        amount: game.amount,
      })],
    });
  },
};