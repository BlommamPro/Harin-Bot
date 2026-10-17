import { createEmbed, COLORS } from '../../../utils/embeds.js';
import { header } from '../../../utils/embedDecorations.js';

const CATEGORY_NAMES = {
  general: 'General',
  moderation: 'Moderación',
  administration: 'Administración',
  fun: 'Diversión',
  economy: 'Economía',
  music: 'Música',
  utility: 'Utilidad',
  owner: 'Dueño',
  nsfw: 'NSFW',
  tickets: 'Tickets',
  giveaways: 'Sorteos',
  leveling: 'Niveles',
  welcome: 'Bienvenida',
  logs: 'Logs',
};

const CATEGORY_EMOJIS = {
  general: '🌐',
  moderation: '🛡️',
  administration: '⚙️',
  economy: '💰',
  leveling: '⭐',
  giveaways: '🎁',
  owner: '👑',
};

export default {
  customId: 'help-category',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,

  async execute(client, interaction) {
    await interaction.deferUpdate();

    const selectedCategory = interaction.values[0];

    const commands = [];
    for (const [, cmd] of client.slashCommands) {
      const cat = (cmd.CATEGORY || 'general').toLowerCase();
      if (cat === selectedCategory) {
        commands.push(`\`/${cmd.CMD.name}\` — ${cmd.CMD.description}`);
      }
    }

    commands.sort();

    const displayName = CATEGORY_NAMES[selectedCategory]
      || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    const emoji = CATEGORY_EMOJIS[selectedCategory] || '📁';

    const description = commands.length
      ? [header(emoji, displayName), '', commands.join('\n')].join('\n')
      : 'No hay comandos en esta categoría.';

    const embed = createEmbed({
      color: COLORS.INFO,
      title: `${emoji} ${displayName}`,
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.editReply({ embeds: [embed] });
  },
};