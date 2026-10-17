import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, kv, getMedal, formatNumber } from '../../utils/embedDecorations.js';
import { GuildEconomy } from '../../models/GuildEconomy.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Top 10 usuarios más ricos del servidor')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('tipo')
         .setDescription('Ordenar por')
         .setRequired(false)
         .addChoices(
           { name: 'Riqueza total (mano + banco)', value: 'total' },
           { name: 'Dinero en mano', value: 'wallet' },
           { name: 'Dinero en banco', value: 'bank' }
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('tipo') || 'total';

    let sortField = { totalWealth: -1 };
    let titleSuffix = 'Riqueza total';

    if (type === 'wallet') {
      sortField = { balance: -1 };
      titleSuffix = 'Dinero en mano';
    } else if (type === 'bank') {
      sortField = { bank: -1 };
      titleSuffix = 'Dinero en banco';
    }

    const pipeline = [
      { $match: { guildId: interaction.guildId } },
      { $addFields: { totalWealth: { $add: ['$balance', '$bank'] } } },
      { $sort: sortField },
      { $limit: 10 },
    ];

    const top = await GuildEconomy.aggregate(pipeline);

    if (top.length === 0) {
      return interaction.editReply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: `🏆 Top · ${titleSuffix}`,
          description: 'Nadie tiene coins en este servidor todavía.\n\nEmpieza con `/daily` o `/work`.',
        })],
      });
    }

    const lines = top.map((u, i) => {
      const total = (u.balance || 0) + (u.bank || 0);
      return `${getMedal(i)} <@${u.userId}>\n> \`${formatNumber(u.balance)}\` en mano · \`${formatNumber(u.bank)}\` en banco\n> Total: **${formatNumber(total)}** coins`;
    });

    const description = [
      header('🏆', `Top · ${titleSuffix}`),
      '',
      lines.join('\n\n'),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.ECONOMY,
      title: `💰 Ranking · ${titleSuffix}`,
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    return interaction.editReply({ embeds: [embed] });
  },
};