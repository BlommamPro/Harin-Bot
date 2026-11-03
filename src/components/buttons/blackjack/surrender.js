import { MessageFlags } from 'discord.js';
import { errorEmbed, createEmbed, COLORS } from '../../../utils/embeds.js';
import { block, kv, formatNumber } from '../../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../../utils/guildData.js';
import { getGame, deleteGame } from '../../../utils/blackjackStore.js';
import { handValue, formatHand } from '../../../commands/economy/blackjack.js';

export default {
  customId: 'bj_surrender_{}_{}',
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
    if (game.timeoutHandle) clearTimeout(game.timeoutHandle);

    const refund = Math.floor(game.currentBet / 2);
    await updateGuildEconomy(game.guildId, game.userId, { $inc: { balance: refund } });
    deleteGame(gameId);

    const description = [
      block([
        kv('Tu mano', `${formatHand(game.playerHand)} **(${handValue(game.playerHand)})**`),
        kv('Dealer', `${formatHand(game.dealerHand)} **(${handValue(game.dealerHand)})**`),
      ]),
      '',
      `**Te retiraste.** Recuperas \`${formatNumber(refund)}\` coins (la mitad de tu apuesta).`,
    ].join('\n');

    const embed = createEmbed({ title: '🃏 Blackjack', color: COLORS.WARNING, description });
    await interaction.update({ embeds: [embed], components: [] });
  },
};