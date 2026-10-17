import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { getGuildEconomy } from '../../utils/guildData.js';
import { formatAchievements } from '../../utils/achievements.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('Ver tus logros o los de otro usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario')
         .setDescription('Usuario a consultar (opcional)')
         .setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('usuario') || interaction.user;
    await getGuildEconomy(interaction.guildId, target.id, target.username);

    const result = await formatAchievements(interaction.guildId, target.id);

    const description = [
      block([kv('Progreso', `\`${result.unlocked} / ${result.total}\``)]),
      '',
      result.text,
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.LEVELING,
      title: `🏆 Logros de ${target.username}`,
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