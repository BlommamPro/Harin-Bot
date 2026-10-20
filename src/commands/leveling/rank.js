import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import {
  header, block, kv, createProgressBar, formatPercentage, formatNumber,
} from '../../utils/embedDecorations.js';
import { getGuildLevel, getXpForLevel } from '../../utils/levelSystem.js';
import { getUserData } from '../../utils/guildData.js';

function getGlobalXpForLevel(level) {
  return level * level * 100;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Muestra tu progreso de nivel')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a ver (opcional)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Ver nivel del servidor o global')
         .setRequired(false)
         .addChoices(
           { name: '🏠 Servidor', value: 'guild' },
           { name: '🌍 Global', value: 'global' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const type = interaction.options.getString('tipo') || 'guild';

    if (type === 'global') {
      const data = await getUserData(target.id, target.username);
      const xpNeeded = getGlobalXpForLevel(data.level);
      const bar = createProgressBar(data.xp, xpNeeded, 16);
      const pct = formatPercentage(data.xp, xpNeeded);

      const description = block([
        kv('Nivel', `\`${data.level}\``),
        kv('XP', `\`${formatNumber(data.xp)} / ${formatNumber(xpNeeded)}\``),
        `\`${bar}\` **${pct}%**`,
        kv('Mensajes', `\`${formatNumber(data.messages)}\``),
      ]);

      const embed = createEmbed({
        color: COLORS.LEVELING,
        title: `🌍 Rango global · ${target.username}`,
        thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
        description,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed] });
    }

    const data = await getGuildLevel(interaction.guildId, target.id);
    const xpNeeded = getXpForLevel(data.level);
    const bar = createProgressBar(data.xp, xpNeeded, 16);
    const pct = formatPercentage(data.xp, xpNeeded);

    const description = block([
      kv('Nivel', `\`${data.level}\``),
      kv('XP', `\`${formatNumber(data.xp)} / ${formatNumber(xpNeeded)}\``),
      `\`${bar}\` **${pct}%**`,
      kv('Mensajes', `\`${formatNumber(data.messages)}\``),
    ]);

    const embed = createEmbed({
      color: COLORS.LEVELING,
      title: `🏠 Rango en ${interaction.guild.name} · ${target.username}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};