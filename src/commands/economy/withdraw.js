import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
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

  async execute(client, interaction) {
    await interaction.deferReply();

    const input = interaction.options.getString('cantidad').toLowerCase().trim();
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);
    const currentBank = economy?.bank || 0;

    let amount = 0;
    if (input === 'all') {
      amount = currentBank;
    } else {
      amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        return interaction.editReply({ embeds: [errorEmbed('Introduce una cantidad válida o "all".')] });
      }
    }

    if (currentBank <= 0) {
      return interaction.editReply({ embeds: [errorEmbed('No tienes dinero en el banco.')] });
    }

    if (amount > currentBank) amount = currentBank;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: amount, bank: -amount },
    });

    const newWallet = (economy?.balance || 0) + amount;
    const newBank = currentBank - amount;

    const description = block([
      kv('Retirado', `\`${formatNumber(amount)} coins\``),
      kv('En mano', `\`${formatNumber(newWallet)} coins\``),
      kv('Banco', `\`${formatNumber(newBank)} coins\``),
      kv('Total', `\`${formatNumber(newWallet + newBank)} coins\``),
    ]);

    const embed = createEmbed({
      color: COLORS.SUCCESS,
      title: '🏦 Retiro exitoso',
      description,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};