import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { applyBetLuck } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { checkAchievements } from '../../utils/achievements.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';
import { getActiveMultiplier, applyEventMultiplier } from '../../utils/eventManager.js';
import { createGame, deleteGame, getGame } from '../../utils/blackjackStore.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

export function handValue(hand) {
  let value = 0;
  let aces = 0;
  for (const card of hand) {
    value += cardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
}

export function formatCard(card) {
  return `${card.suit}${card.rank}`;
}

export function formatHand(hand, hideFirst = false) {
  if (hideFirst) return `🎴 ${hand.slice(1).map(formatCard).join(' ')}`;
  return hand.map(formatCard).join(' ');
}

export function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

export function buildGameButtons(userId, gameId, { canDouble = true, doubled = false, remainingBalance = 0, amount = 0 } = {}) {
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`bj_hit_${userId}_${gameId}`)
      .setLabel('Pedir carta')
      .setEmoji('🃏')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`bj_stand_${userId}_${gameId}`)
      .setLabel('Plantarse')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Success),
  );
  if (canDouble && !doubled && remainingBalance >= amount) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`bj_double_${userId}_${gameId}`)
        .setLabel('Doblar')
        .setEmoji('💥')
        .setStyle(ButtonStyle.Danger),
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`bj_surrender_${userId}_${gameId}`)
      .setLabel('Retirarse')
      .setEmoji('🏳️')
      .setStyle(ButtonStyle.Secondary),
  );
  return row;
}

export function buildGameEmbed(game, status = '') {
  const description = [
    block([
      kv('Apuesta', `\`${formatNumber(game.currentBet)} coins\``),
      kv('Tu mano', `${formatHand(game.playerHand)} **(${handValue(game.playerHand)})**`),
      kv('Dealer', formatHand(game.dealerHand, true)),
    ]),
    status ? `\n${status}` : '-# Elige una acción con los botones de abajo.',
  ].join('\n');

  return createEmbed({ title: '🃏 Blackjack', color: COLORS.ECONOMY, description });
}

export async function resolveDealer(game, interaction) {
  const { playerHand, dealerHand, deck, currentBet, guildId, userId, economy, coinsMultiplier } = game;

  while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());

  const pVal = handValue(playerHand);
  const dVal = handValue(dealerHand);

  let winAmount = 0;
  let status = '';
  let color = COLORS.ERROR;

  if (dVal > 21) {
    const base = currentBet * 2;
    const withLuck = applyBetLuck(base, economy.upgrades);
    winAmount = applyEventMultiplier(withLuck, coinsMultiplier);
    status = `**El dealer se pasó (${dVal}).** Ganaste \`${formatNumber(winAmount - currentBet)}\` coins.`;
    color = COLORS.SUCCESS;
  } else if (pVal > dVal) {
    const base = currentBet * 2;
    const withLuck = applyBetLuck(base, economy.upgrades);
    winAmount = applyEventMultiplier(withLuck, coinsMultiplier);
    status = `**Ganaste** (${pVal} vs ${dVal}). Recibes \`${formatNumber(winAmount - currentBet)}\` coins.`;
    color = COLORS.SUCCESS;
  } else if (pVal === dVal) {
    winAmount = currentBet;
    status = `**Empate** (${pVal} vs ${dVal}). Recuperas \`${formatNumber(currentBet)}\` coins.`;
    color = COLORS.WARNING;
  } else {
    status = `**Perdiste** (${pVal} vs ${dVal}). Pierdes \`${formatNumber(currentBet)}\` coins.`;
    color = COLORS.ERROR;
  }

  if (winAmount > 0) {
    await updateGuildEconomy(guildId, userId, { $inc: { balance: winAmount } });
    const netWin = winAmount - currentBet;
    if (netWin > 0) {
      await addWeeklyCoins(guildId, userId, interaction.user.username, netWin);
    }
  }

  const description = [
    block([
      kv('Tu mano', `${formatHand(playerHand)} **(${pVal})**`),
      kv('Dealer', `${formatHand(dealerHand)} **(${dVal})**`),
    ]),
    '',
    status,
  ].join('\n');

  const embed = createEmbed({ title: '🃏 Blackjack', color, description });

  if (game.timeoutHandle) clearTimeout(game.timeoutHandle);
  deleteGame(game.gameId);

  await interaction.update({ embeds: [embed], components: [] });

  if (winAmount > currentBet) {
    await updateGuildEconomy(guildId, userId, { $inc: { blackjackWins: 1 } });
    const updatedEconomy = await getGuildEconomy(guildId, userId);
    await checkAchievements(guildId, userId, updatedEconomy);
  }
}

export async function endGame(game, interaction, status, color = COLORS.ERROR) {
  if (game.timeoutHandle) clearTimeout(game.timeoutHandle);
  deleteGame(game.gameId);

  const pVal = handValue(game.playerHand);
  const dVal = handValue(game.dealerHand);

  const description = [
    block([
      kv('Tu mano', `${formatHand(game.playerHand)} **(${pVal})**`),
      kv('Dealer', `${formatHand(game.dealerHand)} **(${dVal})**`),
    ]),
    '',
    status,
  ].join('\n');

  const embed = createEmbed({ title: '🃏 Blackjack', color, description });
  await interaction.update({ embeds: [embed], components: [] });
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Juega al Blackjack contra el bot')
    .setDMPermission(false)
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(1)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.editReply({ embeds: economyDisabled.embeds });

    const amount = interaction.options.getInteger('cantidad');
    const config = await getEconomyConfig(interaction.guildId);

    if (amount < config.minBet) {
      return interaction.editReply({ embeds: [errorEmbed(`La apuesta mínima es ${config.minBet} coins.`)] });
    }
    if (amount > config.maxBet) {
      return interaction.editReply({ embeds: [errorEmbed(`La apuesta máxima es ${config.maxBet} coins.`)] });
    }

    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);
    const wallet = economy?.balance || 0;

    if (wallet < amount) {
      return interaction.editReply({
        embeds: [errorEmbed(`No tienes suficientes coins. Tienes ${wallet} y apostaste ${amount}.`)],
      });
    }

    const remainingBalance = wallet - amount;

    const cd = await checkDbCooldown(interaction.user.id, `blackjack_${interaction.guildId}`, config.blackjackCooldownSeconds / 60);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Espera un momento. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });
    await setDbCooldown(interaction.user.id, `blackjack_${interaction.guildId}`);

    const coinsMultiplier = await getActiveMultiplier('coins').catch(() => 1);

    const deck = shuffle(createDeck());
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    if (isBlackjack(playerHand)) {
      let resultText = '';
      let color = COLORS.SUCCESS;

      if (isBlackjack(dealerHand)) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: amount } });
        resultText = '**Empate.** Ambos tienen Blackjack. Recuperas tu apuesta.';
        color = COLORS.WARNING;
      } else {
        const baseWinnings = Math.floor(amount * 1.5);
        const withLuck = applyBetLuck(baseWinnings, economy.upgrades);
        const winnings = applyEventMultiplier(withLuck, coinsMultiplier);
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: amount + winnings } });
        await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, winnings);
        resultText = `**¡Blackjack!** Ganaste \`${formatNumber(winnings)}\` coins (pago 3:2).`;
      }

      const description = [
        block([
          kv('Tu mano', `${formatHand(playerHand)} **(${handValue(playerHand)})**`),
          kv('Dealer', `${formatHand(dealerHand)} **(${handValue(dealerHand)})**`),
        ]),
        '',
        resultText,
      ].join('\n');

      const embed = createEmbed({ title: '🃏 Blackjack', color, description });
      return interaction.editReply({ embeds: [embed] });
    }

    if (isBlackjack(dealerHand)) {
      const description = [
        block([
          kv('Tu mano', `${formatHand(playerHand)} **(${handValue(playerHand)})**`),
          kv('Dealer', `${formatHand(dealerHand)} **(21)**`),
        ]),
        '',
        `**El dealer tiene Blackjack.** Perdiste \`${formatNumber(amount)}\` coins.`,
      ].join('\n');

      const embed = createEmbed({ title: '🃏 Blackjack', color: COLORS.ERROR, description });
      return interaction.editReply({ embeds: [embed] });
    }

    const gameId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const game = {
      gameId,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: null,
      amount,
      currentBet: amount,
      doubled: false,
      playerHand,
      dealerHand,
      deck,
      economy,
      coinsMultiplier,
      remainingBalance,
      resolved: false,
      timeoutHandle: null,
    };

    createGame(gameId, game);

    const msg = await interaction.editReply({
      embeds: [buildGameEmbed(game)],
      components: [buildGameButtons(interaction.user.id, gameId, {
        canDouble: true,
        doubled: false,
        remainingBalance,
        amount,
      })],
    });

    game.messageId = msg.id;

    game.timeoutHandle = setTimeout(async () => {
      const current = getGame(gameId);
      if (!current) return;
      deleteGame(gameId);

      await updateGuildEconomy(current.guildId, current.userId, { $inc: { balance: current.currentBet } });

      try {
        const channel = await client.channels.fetch(current.channelId).catch(() => null);
        if (!channel?.isTextBased()) return;
        const message = await channel.messages.fetch(current.messageId).catch(() => null);
        if (!message) return;
        await message.edit({
          embeds: [errorEmbed(`Se acabó el tiempo. Tu apuesta de \`${formatNumber(current.currentBet)}\` coins ha sido devuelta.`)],
          components: [],
        });
      } catch { /* ignorar */ }
    }, 120_000);
  },
};