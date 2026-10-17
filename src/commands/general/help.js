import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, MessageFlags } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';

const CATEGORY_INFO = {
  general: { label: 'General', emoji: '🌐', description: 'Comandos generales' },
  moderation: { label: 'Moderación', emoji: '🛡️', description: 'Herramientas de moderación' },
  administration: { label: 'Administración', emoji: '⚙️', description: 'Configuración del bot' },
  economy: { label: 'Economía', emoji: '💰', description: 'Sistema de economía' },
  leveling: { label: 'Niveles', emoji: '⭐', description: 'Sistema de niveles' },
  giveaways: { label: 'Sorteos', emoji: '🎁', description: 'Sistema de sorteos' },
  owner: { label: 'Dueño', emoji: '👑', description: 'Comandos exclusivos del dueño' },
};

function getCategoryInfo(catName) {
  return CATEGORY_INFO[catName] || {
    label: catName.charAt(0).toUpperCase() + catName.slice(1),
    emoji: '📁',
    description: `Comandos de ${catName}`,
  };
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos disponibles'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    const categories = new Map();

    for (const [, cmd] of client.slashCommands) {
      const cat = (cmd.CATEGORY || 'general').toLowerCase();
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }

    const description = [
      'Selecciona una categoría en el menú para ver sus comandos.',
      '',
      header('📊', 'Resumen'),
      block([
        kv('Comandos totales', `\`${client.slashCommands.size}\``),
        kv('Categorías', `\`${categories.size}\``),
      ]),
      '',
      `[Política de Privacidad](https://blommampro.github.io/harin-bot-legal/privacy)`,
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.INFO,
      title: '📖 Menú de ayuda',
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    const options = [];
    for (const [cat, count] of categories) {
      const info = getCategoryInfo(cat);
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(info.label)
          .setDescription(`${info.description} (${count})`)
          .setValue(cat)
          .setEmoji(info.emoji)
      );
    }

    options.sort((a, b) => a.data.label.localeCompare(b.data.label));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help-category')
      .setPlaceholder('Selecciona una categoría')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};