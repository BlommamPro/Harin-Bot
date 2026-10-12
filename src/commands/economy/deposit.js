import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getGuildEconomy, updateGuildEconomy, getUserData } from '../../utils/guildData.js';
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

  async execute(client, interaction, guildData, userData) {
    await interaction.deferReply();

    const input = interaction.options.getString('cantidad').toLowerCase().trim();
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);
    const globalUser = await getUserData(interaction.user.id);

    const currentWallet = economy?.balance || 0;
    const currentBank = economy?.bank || 0;
    const userLevel = globalUser?.level || 1;
    const maxCapacity = getBankCapacity(userLevel, economy.upgrades);

    let amount = 0;
    if (input === 'all') {
      amount = currentWallet;
    } else {
      amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        return interaction.editReply({ embeds: [errorEmbed('Introduce una cantidad válida o `all`.')] });
      }
    }

    if (currentWallet <= 0) {
      return interaction.editReply({ embeds: [errorEmbed('No tienes dinero en mano para depositar.')] });
    }

    if (amount >= currentWallet) {
      amount = currentWallet - 1;
      if (amount <= 0) {
        return interaction.editReply({ embeds: [errorEmbed('Debes dejar al menos **1 coin** en mano.')] });
      }
    }

    const spaceLeft = maxCapacity - currentBank;
    if (spaceLeft <= 0) {
      return interaction.editReply({
        embeds: [errorEmbed(`Tu banco está lleno. Capacidad: **${maxCapacity}** (Nivel ${userLevel}).`)]
      });
    }

    if (amount > spaceLeft) amount = spaceLeft;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: -amount, bank: amount }
    });

    const newWallet = currentWallet - amount;
    const newBank = currentBank + amount;

    const embed = successEmbed(
      `Depositaste **${amount} coins** en el banco.\n\n` +
      `💰 En mano: **${newWallet}**\n` +
      `🏦 Banco: **${newBank} / ${maxCapacity}**\n` +
      `📊 Total: **${newWallet + newBank}**`
    );
    embed.setTitle('🏦 Depósito Exitoso');

    return interaction.editReply({ embeds: [embed] });
  }
};