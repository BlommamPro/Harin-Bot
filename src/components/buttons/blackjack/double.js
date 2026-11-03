import { MessageFlags } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds.js';
import { getGuildEconomy, updateGuildEconomy } from '../../../utils/guildData.js';
import { getGame } from '../../../utils/blackjackStore.js';
import {
  handValue,
  endGame,
  resolveDealer,
} from '../../../commands/economy/blackjack.js';

export default {
  customId: 'bj_double_{}_{}',
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

    if (game.doubled) {
      return interaction.reply({
        embeds: [errorEmbed('Ya doblaste en esta partida.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const freshEconomy = await getGuildEconomy(game.guildId, game.userId);
    const currentBalance = freshEconomy?.balance || 0;

    if (currentBalance < game.amount) {
      return interaction.reply({
        embeds: [errorEmbed('No tienes suficiente dinero para doblar.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    game.doubled = true;
    game.currentBet *= 2;
    await updateGuildEconomy(game.guildId, game.userId, { $inc: { balance: -game.amount } });

    game.playerHand.push(game.deck.pop());
    const pVal = handValue(game.playerHand);

    game.resolved = true;

    if (pVal > 21) {
      return endGame(game, interaction, `**Te pasaste (${pVal}).** Perdiste \`${game.currentBet}\` coins.`);
    }

    return resolveDealer(game, interaction);
  },
};