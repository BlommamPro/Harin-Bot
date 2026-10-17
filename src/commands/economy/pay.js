import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Transfiere coins a otro usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a transferir').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad de coins').setRequired(true).setMinValue(1)
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

    const target = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ embeds: [errorEmbed('No puedes transferirte coins a ti mismo.')] });
    }
    if (target.bot) {
      return interaction.editReply({ embeds: [errorEmbed('No puedes transferirle coins a un bot.')] });
    }

    const config = await getEconomyConfig(interaction.guildId);
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const cd = await checkDbCooldown(interaction.user.id, `pay_${interaction.guildId}`, config.payCooldownMinutes);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Espera antes de hacer otra transferencia. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    if ((economy?.balance || 0) < amount) {
      return interaction.editReply({
        embeds: [errorEmbed(`No tienes suficientes coins. Tienes \`${formatNumber(economy.balance)}\` y quieres enviar \`${formatNumber(amount)}\`.`)],
      });
    }

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -amount } });
    await updateGuildEconomy(interaction.guildId, target.id, {
      $inc: { balance: amount },
      $set: { username: target.username },
    });
    await setDbCooldown(interaction.user.id, `pay_${interaction.guildId}`);

    const description = [
      header('💸', 'Transferencia completada'),
      block([
        kv('Destinatario', target),
        kv('Cantidad', `\`${formatNumber(amount)} coins\``),
        kv('Tu balance', `\`${formatNumber(economy.balance - amount)} coins\``),
      ]),
    ].join('\n');

    const embed = successEmbed(description);
    return interaction.editReply({ embeds: [embed] });
  },
};