import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('top')
    .setDescription('🏆 Top 10 usuarios más ricos del servidor')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Ordenar por')
         .setRequired(false)
         .addChoices(
           { name: '💰 Riqueza total (mano + banco)', value: 'total' },
           { name: '💵 Dinero en mano', value: 'wallet' },
           { name: '🏦 Dinero en banco', value: 'bank' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const type = interaction.options.getString('tipo') || 'total';

    let sortField = { totalWealth: -1 };
    let titleSuffix = 'Riqueza Total';

    if (type === 'wallet') {
      sortField = { balance: -1 };
      titleSuffix = 'Dinero en Mano';
    } else if (type === 'bank') {
      sortField = { bank: -1 };
      titleSuffix = 'Dinero en Banco';
    }

    const pipeline = [
      { $match: { guildId: interaction.guildId } },
      { $addFields: { totalWealth: { $add: ['$balance', '$bank'] } } },
      { $sort: sortField },
      { $limit: 10 }
    ];

    const top = await GuildEconomy.aggregate(pipeline);

    if (top.length === 0) {
      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: `🏆 Top ${titleSuffix} — ${interaction.guild.name}`,
          description: `Nadie tiene coins en este servidor todavía.\n\nEmpieza con \`/daily\` o \`/work\`.`
        })]
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const description = top.map((u, i) => {
      const total = (u.balance || 0) + (u.bank || 0);
      return [
        `${medals[i] || '🔹'} <@${u.userId}>`,
        `> 💵 Mano: **${u.balance.toLocaleString()}** | 🏦 Banco: **${u.bank.toLocaleString()}**`,
        `> 📊 Total: **${total.toLocaleString()} coins**`
      ].join('\n');
    }).join('\n\n');

    const embed = createEmbed({
      color: COLORS.ECONOMY,
      title: `🏆 Top ${titleSuffix} — ${interaction.guild.name}`,
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};