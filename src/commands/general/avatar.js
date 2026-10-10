import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
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

  async execute(client, interaction, guildData, userData) {
    const target = interaction.options.getUser('usuario') || interaction.user;

    const embed = createEmbed({
      color: COLORS.GENERAL,
      title: `🖼️ Avatar de ${target.username}`,
      image: { url: target.displayAvatarURL({ size: 4096, dynamic: true }) },
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};