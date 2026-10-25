import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, createProgressBar, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy } from '../../utils/guildData.js';
import { getGuildLevel } from '../../utils/levelSystem.js';
import { getUpgradeEffect } from '../../utils/economyConfig.js';

function getBankCapacity(level, upgrades) {
  const base = level * 500;
  const multiplier = getUpgradeEffect(upgrades, 'better_bank');
  return multiplier > 0 ? Math.floor(base * multiplier) : base;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Muestra tu balance bancario y en mano')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a consultar (opcional)').setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('usuario') || interaction.user;
    const data = await getGuildEconomy(interaction.guildId, target.id, target.username);
    const guildLevelData = await getGuildLevel(interaction.guildId, target.id);
    const level = guildLevelData.level || 1;

    const wallet = data?.balance || 0;
    const bank = data?.bank || 0;
    const total = wallet + bank;
    const maxCapacity = getBankCapacity(level, data.upgrades);
    const bar = createProgressBar(bank, maxCapacity, 14);
    const pct = maxCapacity > 0 ? Math.round((bank / maxCapacity) * 100) : 0;

    const description = [
      block([
        kv('En mano', `\`${formatNumber(wallet)} coins\``),
        kv('Banco', `\`${formatNumber(bank)} / ${formatNumber(maxCapacity)}\``),
        kv('Total', `\`${formatNumber(total)} coins\``),
      ]),
      '',
      `\`${bar}\` **${pct}%**`,
      `-# Nivel del servidor: **${level}** · La mejora \`better_bank\` multiplica la capacidad`,
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.ECONOMY,
      title: `💰 Balance de ${target.username}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    return interaction.editReply({ embeds: [embed] });
  },
};