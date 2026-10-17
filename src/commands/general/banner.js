import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, COLORS, errorEmbed } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Muestra el banner de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario')
         .setDescription('Usuario a ver (por defecto: tú)')
         .setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const fetchedUser = await client.users.fetch(target.id, { force: true });

    if (!fetchedUser.banner) {
      return interaction.reply({
        embeds: [errorEmbed(`${target.username} no tiene banner.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const isSelf = target.id === interaction.user.id;

    const description = block([
      kv('Usuario', fetchedUser.tag),
      kv('ID', `\`${fetchedUser.id}\``),
    ]);

    const embed = createEmbed({
      color: COLORS.GENERAL,
      title: isSelf ? '🖼️ Tu banner' : `🖼️ Banner de ${fetchedUser.username}`,
      description,
      image: { url: fetchedUser.bannerURL({ size: 4096, dynamic: true }) },
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};