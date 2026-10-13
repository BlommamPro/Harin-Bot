import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} from "discord.js";
import { createEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGuildEconomy, updateGuildEconomy } from "../../utils/guildData.js";
import { checkDbCooldown, setDbCooldown } from "../../utils/economyCooldowns.js";
import { applyBetLuck } from "../../utils/applyUpgrades.js";
import { addWeeklyCoins } from "../../utils/weeklyRanking.js";
import { checkAchievements } from "../../utils/achievements.js";
import { getEconomyConfig } from "../../utils/economyConfigGuild.js";
import { checkEconomyEnabled } from "../../utils/economyGuard.js";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

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
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return parseInt(card.rank);
}

function handValue(hand) {
  let value = 0;
  let aces = 0;
  for (const card of hand) {
    value += cardValue(card);
    if (card.rank === "A") aces++;
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
  if (hideFirst) return `🎴 ${hand.slice(1).map(formatCard).join(" ")}`;
  return hand.map(formatCard).join(" ");
}

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Juega al Blackjack contra el bot")
    .setDMPermission(false)
    .addIntegerOption((opt) =>
      opt.setName("cantidad").setDescription("Cantidad a apostar").setRequired(true).setMinValue(1)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) {
      return interaction.editReply({ embeds: economyDisabled.embeds });
    }

    const amount = interaction.options.getInteger("cantidad");
    const config = await getEconomyConfig(interaction.guildId);

    if (amount < config.minBet) {
      return interaction.editReply({
        embeds: [errorEmbed(`La apuesta mínima es **${config.minBet}** coins.`)],
      });
    }
    if (amount > config.maxBet) {
      return interaction.editReply({
        embeds: [errorEmbed(`La apuesta máxima es **${config.maxBet}** coins.`)],
      });
    }

    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);
    const wallet = economy?.balance || 0;

    if (wallet < amount) {
      return interaction.editReply({
        embeds: [errorEmbed(`No tienes suficientes coins. Tienes **${wallet}** y apostaste **${amount}**.`)],
      });
    }

    const remainingBalance = wallet - amount;

    const cd = await checkDbCooldown(interaction.user.id, `blackjack_${interaction.guildId}`, config.blackjackCooldownSeconds / 60);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Espera un momento. <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });
    await setDbCooldown(interaction.user.id, `blackjack_${interaction.guildId}`);

    let deck = shuffle(createDeck());
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    const playerValue = handValue(playerHand);

    if (isBlackjack(playerHand)) {
      let winnings = 0;
      let resultText = "";

      if (isBlackjack(dealerHand)) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: amount } });
        resultText = "¡Ambos tienen Blackjack! Es un **empate**. Recuperas tu apuesta.";
      } else {
        const baseWinnings = Math.floor(amount * 1.5);
        winnings = applyBetLuck(baseWinnings, economy.upgrades);
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: amount + winnings } });
        await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, winnings);
        resultText = `¡**BLACKJACK!** Ganaste **${winnings} coins** (pago 3:2).`;
      }

      const embed = createEmbed({
        title: "🃏 Blackjack",
        description: resultText,
        color: "#57F287",
        fields: [
          { name: `Tu mano (${handValue(playerHand)})`, value: formatHand(playerHand), inline: true },
          { name: `Dealer (${handValue(dealerHand)})`, value: formatHand(dealerHand), inline: true },
        ],
      });

      return interaction.editReply({ embeds: [embed] });
    }

    if (isBlackjack(dealerHand)) {
      const embed = createEmbed({
        title: "🃏 Blackjack — Perdiste",
        description: `El dealer tiene Blackjack. Perdiste **${amount} coins**.`,
        color: "#ED4245",
        fields: [
          { name: `Tu mano (${playerValue})`, value: formatHand(playerHand), inline: true },
          { name: `Dealer (21)`, value: formatHand(dealerHand), inline: true },
        ],
      });

      return interaction.editReply({ embeds: [embed] });
    }

    const gameId = Date.now().toString(36);
    let currentBet = amount;
    let doubled = false;
    let gameOver = false;
    let resolved = false;

    const generateEmbed = (status = "") => {
      return createEmbed({
        title: "🃏 Blackjack",
        description: status || `Apuesta: **${currentBet} coins**`,
        fields: [
          { name: `Tu mano (${handValue(playerHand)})`, value: formatHand(playerHand), inline: true },
          { name: `Dealer (? )`, value: formatHand(dealerHand, true), inline: true },
        ],
      });
    };

    const generateButtons = (canDouble = true) => {
      const row = new ActionRowBuilder();
      row.addComponents(
        new ButtonBuilder().setCustomId(`bj_hit_${interaction.user.id}_${gameId}`).setLabel("🃏 Pedir (Hit)").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`bj_stand_${interaction.user.id}_${gameId}`).setLabel("🛑 Plantarse (Stand)").setStyle(ButtonStyle.Success),
      );
      if (canDouble && !doubled && remainingBalance >= amount) {
        row.addComponents(
          new ButtonBuilder().setCustomId(`bj_double_${interaction.user.id}_${gameId}`).setLabel("💰 Doblar (Double)").setStyle(ButtonStyle.Danger),
        );
      }
      return row;
    };

    const msg = await interaction.editReply({ embeds: [generateEmbed()], components: [generateButtons(true)] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => {
        const parts = i.customId.split("_");
        return parts[2] === interaction.user.id && parts[3] === gameId;
      },
      time: 120000,
    });

    const endGame = async (i, status, winAmount = 0) => {
      if (resolved) return;
      resolved = true;
      gameOver = true;
      collector.stop();

      if (winAmount > 0) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: winAmount } });
      }

      const pVal = handValue(playerHand);
      const dVal = handValue(dealerHand);

      const embed = createEmbed({
        title: winAmount > currentBet ? "🃏 Blackjack — ¡Ganaste!" : winAmount === currentBet ? "🃏 Blackjack — Empate" : "🃏 Blackjack — Perdiste",
        description: status,
        color: winAmount > currentBet ? "#57F287" : winAmount === currentBet ? "#FEE75C" : "#ED4245",
        fields: [
          { name: `Tu mano (${pVal})`, value: formatHand(playerHand), inline: true },
          { name: `Dealer (${dVal})`, value: formatHand(dealerHand), inline: true },
        ],
      });

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
      let status = "";

      if (dVal > 21) {
        winAmount = applyBetLuck(currentBet * 2, economy.upgrades);
        status = `El dealer se pasó (**${dVal}**). ¡Ganaste **${winAmount - currentBet} coins**!`;
      } else if (pVal > dVal) {
        winAmount = applyBetLuck(currentBet * 2, economy.upgrades);
        status = `¡Ganaste! (**${pVal}** vs **${dVal}**). Recibes **${winAmount - currentBet} coins**.`;
      } else if (pVal === dVal) {
        winAmount = currentBet;
        status = `Empate (**${pVal}** vs **${dVal}**). Recuperas tu apuesta de **${currentBet} coins**.`;
      } else {
        status = `Perdiste (**${pVal}** vs **${dVal}**). Pierdes **${currentBet} coins**.`;
      }

      if (winAmount > 0) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: winAmount } });
        const netWin = winAmount - currentBet;
        if (netWin > 0) {
          await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, netWin);
        }
      }

      const embed = createEmbed({
        title: winAmount > currentBet ? "🃏 Blackjack — ¡Ganaste!" : winAmount === currentBet ? "🃏 Blackjack — Empate" : "🃏 Blackjack — Perdiste",
        description: status,
        color: winAmount > currentBet ? "#57F287" : winAmount === currentBet ? "#FEE75C" : "#ED4245",
        fields: [
          { name: `Tu mano (${pVal})`, value: formatHand(playerHand), inline: true },
          { name: `Dealer (${dVal})`, value: formatHand(dealerHand), inline: true },
        ],
      });

      await i.update({ embeds: [embed], components: [] });

      if (winAmount > currentBet) {
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { blackjackWins: 1 } });
        const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
        await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);
      }
    };

    collector.on("collect", async (i) => {
      if (gameOver) return;
      const action = i.customId.split("_")[1];

      if (action === "hit") {
        playerHand.push(deck.pop());
        const pVal = handValue(playerHand);

        if (pVal > 21) return endGame(i, `¡Te pasaste! (**${pVal}**). Perdiste **${currentBet} coins**.`, 0);
        if (pVal === 21) return resolveDealer(i);

        await i.update({ embeds: [generateEmbed()], components: [generateButtons(false)] });
      } else if (action === "stand") {
        return resolveDealer(i);
      } else if (action === "double") {
        const freshEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
        const currentBalance = freshEconomy?.balance || 0;

        if (currentBalance < amount) {
          return i.reply({ embeds: [errorEmbed("No tienes suficiente dinero para doblar.")], flags: MessageFlags.Ephemeral });
        }

        doubled = true;
        currentBet *= 2;
        await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });

        playerHand.push(deck.pop());
        const pVal = handValue(playerHand);

        if (pVal > 21) return endGame(i, `¡Te pasaste! (**${pVal}**). Perdiste **${currentBet} coins**.`, 0);

        return resolveDealer(i);
      }
    });

    collector.on("end", async (_, reason) => {
      if (resolved || gameOver) return;

      await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: currentBet } });

      const reasonText = reason === "time" ? "⏰ Se acabó el tiempo" : "⚠️ La partida fue interrumpida";

      try {
        await interaction.editReply({
          embeds: [errorEmbed(`${reasonText}. Tu apuesta de **${currentBet} coins** ha sido devuelta.`)],
          components: [],
        });
      } catch { /* ignorar */ }
    });
  },
};