import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Retira dinero del banco')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad a retirar o "all"').setRequired(true)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const input = interaction.options.getString('cantidad').toLowerCase().trim();
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);
    const currentBank = economy?.bank || 0;

    let amount = 0;
    if (input === 'all') {
      amount = currentBank;
    } else {
      amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({ embeds: [errorEmbed('Introduce una cantidad válida o `all`.')], flags: MessageFlags.Ephemeral });
      }
    }

    if (currentBank <= 0) {
      return interaction.reply({ embeds: [errorEmbed('No tienes dinero en el banco.')], flags: MessageFlags.Ephemeral });
    }

    if (amount > currentBank) amount = currentBank;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: amount, bank: -amount }
    });

    const newWallet = (economy?.balance || 0) + amount;
    const newBank = currentBank - amount;

    const embed = successEmbed(
      `Retiraste **${amount} coins** del banco.\n\n` +
      `💰 En mano: **${newWallet}**\n` +
      `🏦 Banco: **${newBank}**\n` +
      `📊 Total: **${newWallet + newBank}**`
    );
    embed.setTitle('🏦 Retiro Exitoso');

    await interaction.reply({ embeds: [embed] });
  }
};