import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
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

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

function handValue(hand) {
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

function formatCard(card) {
  return `${card.suit}${card.rank}`;
}

function formatHand(hand, hideFirst = false) {
  if (hideFirst) return `🎴 ${hand.slice(1).map(formatCard).join(' ')}`;
  return hand.map(formatCard).join(' ');
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
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

    let deck = shuffle(createDeck());
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    const playerValue = handValue(playerHand);

    if (isBlackjack(playerHand)) {
      let resultText = '';
      let color = COLORS.SUCCESS;

      if (isBlackjack(dealerHand)) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: amount } });
        resultText = '**Empate.** Ambos tienen Blackjack. Recuperas tu apuesta.';
        color = COLORS.WARNING;
      } else {
        const baseWinnings = Math.floor(amount * 1.5);
        const winnings = applyBetLuck(baseWinnings, economy.upgrades);
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
          kv('Tu mano', `${formatHand(playerHand)} **(${playerValue})**`),
          kv('Dealer', `${formatHand(dealerHand)} **(21)**`),
        ]),
        '',
        `**El dealer tiene Blackjack.** Perdiste \`${formatNumber(amount)}\` coins.`,
      ].join('\n');

      const embed = createEmbed({ title: '🃏 Blackjack', color: COLORS.ERROR, description });
      return interaction.editReply({ embeds: [embed] });
    }

    const gameId = Date.now().toString(36);
    let currentBet = amount;
    let doubled = false;
    let gameOver = false;
    let resolved = false;

    const generateEmbed = (status = '') => {
      const description = [
        block([
          kv('Apuesta', `\`${formatNumber(currentBet)} coins\``),
          kv('Tu mano', `${formatHand(playerHand)} **(${handValue(playerHand)})**`),
          kv('Dealer', formatHand(dealerHand, true)),
        ]),
        '',
        status || '-# Elige una acción con los botones de abajo.',
      ].join('\n');

      return createEmbed({ title: '🃏 Blackjack', color: COLORS.ECONOMY, description });
    };

    const generateButtons = (canDouble = true) => {
      const row = new ActionRowBuilder();

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`bj_hit_${interaction.user.id}_${gameId}`)
          .setLabel('Pedir carta')
          .setEmoji('🃏')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`bj_stand_${interaction.user.id}_${gameId}`)
          .setLabel('Plantarse')
          .setEmoji('🛑')
          .setStyle(ButtonStyle.Success),
      );

      if (canDouble && !doubled && remainingBalance >= amount) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`bj_double_${interaction.user.id}_${gameId}`)
            .setLabel('Doblar')
            .setEmoji('💥')
            .setStyle(ButtonStyle.Danger),
        );
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`bj_surrender_${interaction.user.id}_${gameId}`)
          .setLabel('Retirarse')
          .setEmoji('🏳️')
          .setStyle(ButtonStyle.Secondary),
      );

      return row;
    };

    const msg = await interaction.editReply({
      embeds: [generateEmbed()],
      components: [generateButtons(true)],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => {
        const parts = i.customId.split('_');
        return parts[2] === interaction.user.id && parts[3] === gameId;
      },
      time: 120000,
    });

    const endGame = async (i, status) => {
      if (resolved) return;
      resolved = true;
      gameOver = true;
      collector.stop();

      const pVal = handValue(playerHand);
      const dVal = handValue(dealerHand);

      const description = [
        block([
          kv('Tu mano', `${formatHand(playerHand)} **(${pVal})**`),
          kv('Dealer', `${formatHand(dealerHand)} **(${dVal})**`),
        ]),
        '',
        status,
      ].join('\n');

      const embed = createEmbed({ title: '🃏 Blackjack', color: COLORS.ERROR, description });
      await i.update({ embeds: [embed], components: [] });
    };

    const resolveDealer = async (i) => {
      if (resolved) return;
      resolved = true;
      gameOver = true;
      collector.stop();

      while (handValue(dealerHand) < 17) dealerHand.push(deck.pop());

      const pVal = handValue(playerHand);
      const dVal = handValue(dealerHand);

      let winAmount = 0;
      let status = '';
      let color = COLORS.ERROR;

      if (dVal > 21) {
        winAmount = applyBetLuck(currentBet * 2, economy.upgrades);
        status = `**El dealer se pasó (${dVal}).** Ganaste \`${formatNumber(winAmount - currentBet)}\` coins.`;
        color = COLORS.SUCCESS;
      } else if (pVal > dVal) {
        winAmount = applyBetLuck(currentBet * 2, economy.upgrades);
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
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: winAmount } });
        const netWin = winAmount - currentBet;
        if (netWin > 0) {
          await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, netWin);
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
      await i.update({ embeds: [embed], components: [] });

      if (winAmount > currentBet) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { blackjackWins: 1 } });
        const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
        await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);
      }
    };

    collector.on('collect', async (i) => {
      if (gameOver) return;
      const action = i.customId.split('_')[1];

      if (action === 'hit') {
        playerHand.push(deck.pop());
        const pVal = handValue(playerHand);

        if (pVal > 21) return endGame(i, `**Te pasaste (${pVal}).** Perdiste \`${formatNumber(currentBet)}\` coins.`);
        if (pVal === 21) return resolveDealer(i);

        await i.update({ embeds: [generateEmbed()], components: [generateButtons(false)] });
      } else if (action === 'stand') {
        return resolveDealer(i);
      } else if (action === 'surrender') {
        const refund = Math.floor(currentBet / 2);
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: refund } });
        resolved = true;
        gameOver = true;
        collector.stop();

        const description = [
          block([
            kv('Tu mano', `${formatHand(playerHand)} **(${handValue(playerHand)})**`),
            kv('Dealer', `${formatHand(dealerHand)} **(${handValue(dealerHand)})**`),
          ]),
          '',
          `**Te retiraste.** Recuperas \`${formatNumber(refund)}\` coins (la mitad de tu apuesta).`,
        ].join('\n');

        const embed = createEmbed({ title: '🃏 Blackjack', color: COLORS.WARNING, description });
        await i.update({ embeds: [embed], components: [] });
      } else if (action === 'double') {
        const freshEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
        const currentBalance = freshEconomy?.balance || 0;

        if (currentBalance < amount) {
          return i.reply({ embeds: [errorEmbed('No tienes suficiente dinero para doblar.')], flags: MessageFlags.Ephemeral });
        }

        doubled = true;
        currentBet *= 2;
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });

        playerHand.push(deck.pop());
        const pVal = handValue(playerHand);

        if (pVal > 21) return endGame(i, `**Te pasaste (${pVal}).** Perdiste \`${formatNumber(currentBet)}\` coins.`);

        return resolveDealer(i);
      }
    });

    collector.on('end', async (_, reason) => {
      if (resolved || gameOver) return;

      await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: currentBet } });

      const reasonText = reason === 'time' ? 'Se acabó el tiempo' : 'La partida fue interrumpida';

      try {
        await interaction.editReply({
          embeds: [errorEmbed(`${reasonText}. Tu apuesta de \`${formatNumber(currentBet)}\` coins ha sido devuelta.`)],
          components: [],
        });
      } catch { /* ignorar */ }
    });
  },
};