import { createEmbed, COLORS } from '../../../utils/embeds.js';
import { config } from '../../../../config/config.js';

const CATEGORY_NAMES = {
  general: 'General',
  moderation: 'Moderación',
  administration: 'Administración',
  economy: 'Economía',
  leveling: 'Niveles',
  giveaways: 'Sorteos',
  owner: 'Dueño del bot',
  fun: 'Diversión',
  music: 'Música',
  utility: 'Utilidad',
  nsfw: 'NSFW',
  tickets: 'Tickets',
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
    const isOwner = config.ownerIds.includes(interaction.user.id);

    const commands = [];
    for (const [, cmd] of client.slashCommands) {
      const cat = (cmd.CATEGORY || 'general').toLowerCase();
      if (cat !== selectedCategory) continue;
      if (cmd.OWNER === true && !isOwner) continue;
      commands.push(`\`/${cmd.CMD.name}\` — ${cmd.CMD.description}`);
    }

    commands.sort();

    const displayName = CATEGORY_NAMES[selectedCategory]
      || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    const emoji = CATEGORY_EMOJIS[selectedCategory] || '📁';

    const description = commands.length
      ? commands.join('\n')
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