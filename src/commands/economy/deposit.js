import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { getGuildLevel } from '../../utils/levelSystem.js';
import { getUpgradeEffect } from '../../utils/economyConfig.js';

function getBankCapacity(level, upgrades) {
  const base = level * 5000;
  const multiplier = getUpgradeEffect(upgrades, 'better_bank');
  return multiplier > 0 ? Math.floor(base * multiplier) : base;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposita dinero en el banco')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a depositar o "all"').setRequired(true)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const input = interaction.options.getString('cantidad').toLowerCase().trim();
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const guildLevelData = await getGuildLevel(interaction.guildId, interaction.user.id);
    const userLevel = guildLevelData.level || 1;

    const currentWallet = economy?.balance || 0;
    const currentBank = economy?.bank || 0;
    const maxCapacity = getBankCapacity(userLevel, economy.upgrades);

    let amount = 0;
    if (input === 'all') {
      amount = currentWallet;
    } else {
      amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        return interaction.editReply({ embeds: [errorEmbed('Introduce una cantidad válida o "all".')] });
      }
    }

    if (currentWallet <= 0) {
      return interaction.editReply({ embeds: [errorEmbed('No tienes dinero en mano para depositar.')] });
    }

    if (amount >= currentWallet) {
      amount = currentWallet - 1;
      if (amount <= 0) {
        return interaction.editReply({ embeds: [errorEmbed('Debes dejar al menos 1 coin en mano.')] });
      }
    }

    const spaceLeft = maxCapacity - currentBank;
    if (spaceLeft <= 0) {
      return interaction.editReply({
        embeds: [errorEmbed(`Tu banco está lleno. Capacidad: \`${formatNumber(maxCapacity)}\` coins (Nivel servidor: ${userLevel}).`)],
      });
    }

    if (amount > spaceLeft) amount = spaceLeft;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: -amount, bank: amount },
    });

    const newWallet = currentWallet - amount;
    const newBank = currentBank + amount;

    const description = block([
      kv('Depositado', `\`${formatNumber(amount)} coins\``),
      kv('En mano', `\`${formatNumber(newWallet)} coins\``),
      kv('Banco', `\`${formatNumber(newBank)} / ${formatNumber(maxCapacity)}\``),
      kv('Total', `\`${formatNumber(newWallet + newBank)} coins\``),
    ]);

    const embed = createEmbed({
      color: COLORS.SUCCESS,
      title: '🏦 Depósito exitoso',
      description,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};