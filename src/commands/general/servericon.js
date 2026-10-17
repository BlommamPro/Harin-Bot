import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, COLORS, errorEmbed } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('Muestra el icono del servidor')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const guild = interaction.guild;

    if (!guild.icon) {
      return interaction.reply({
        embeds: [errorEmbed('Este servidor no tiene icono configurado.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const description = block([
      kv('Servidor', guild.name),
      kv('ID', `\`${guild.id}\``),
    ]);

    const embed = createEmbed({
      color: COLORS.GENERAL,
      title: `🖼️ Icono de ${guild.name}`,
      description,
      image: { url: guild.iconURL({ size: 4096, dynamic: true }) },
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};