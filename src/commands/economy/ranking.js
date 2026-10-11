import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { WeeklyRanking } from '../../models/WeeklyRanking.js';

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('📅 Ranking semanal de coins ganados en este servidor')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const weekStart = getWeekStart();

    const top = await WeeklyRanking.find({
      guildId: interaction.guildId,
      weekStart
    })
      .sort({ coinsEarned: -1 })
      .limit(10);

    if (top.length === 0) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: '📅 Ranking Semanal',
          description: [
            `Esta semana aún no hay actividad en **${interaction.guild.name}**.`,
            '',
            `Empieza a usar \`/work\`, \`/daily\`, \`/crime\` y más para aparecer aquí.`,
            '',
            `🕐 La semana se reinicia cada **domingo a las 00:00**.`
          ].join('\n')
        })]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const description = top.map((u, i) => {
      return `${medals[i] || '🔹'} <@${u.userId}> — **${u.coinsEarned.toLocaleString()}** coins`;
    }).join('\n');

    const embed = createEmbed({
      color: COLORS.ECONOMY,
      title: `📅 Ranking Semanal — ${interaction.guild.name}`,
      description: [
        `🕐 Semana actual: <t:${Math.floor(weekStart.getTime() / 1000)}:D>`,
        '',
        description,
        '',
        `💡 Solo cuenta el dinero **ganado** esta semana.`
      ].join('\n'),
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};