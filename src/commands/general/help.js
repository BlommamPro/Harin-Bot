import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder , MessageFlags} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';

const DEFAULT_EMOJIS = {
  general: '🌐',
  moderation: '🛡️',
  administration: '⚙️',
  fun: '🎉',
  economy: '💰',
  music: '🎵',
  utility: '🛠️',
  owner: '👑',
  nsfw: '🔞',
  tickets: '🎫',
  giveaways: '🎁',
  leveling: '⭐',
  welcome: '👋',
  logs: '📋'
};

function getCategoryInfo(catName) {
  const name = catName.toLowerCase();
  if (DEFAULT_EMOJIS[name]) {
    return {
      label: name.charAt(0).toUpperCase() + name.slice(1),
      emoji: DEFAULT_EMOJIS[name],
      description: `Comandos de ${name}`
    };
  }
  return {
    label: name.charAt(0).toUpperCase() + name.slice(1),
    emoji: '📁',
    description: `Comandos de ${name}`
  };
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos disponibles')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,

  async execute(client, interaction, guildData, userData) {
    const categories = new Map();

    for (const [name, cmd] of client.slashCommands) {
      const cat = (cmd.CATEGORY || 'general').toLowerCase();
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }

    const embed = createEmbed({
      title: '📚 Menú de Ayuda',
      description: [
        `Selecciona una categoría del menú de abajo para ver sus comandos.`,
        ``,
        `**Total:** ${client.slashCommands.size} comandos en ${categories.size} categorías`,
        ``,
        `[Política de Privacidad](https://blommampro.github.io/harin-bot-legal/privacy)`
      ].join('\n')
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

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }
};