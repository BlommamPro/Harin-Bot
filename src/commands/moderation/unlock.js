import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Desbloquea un canal para que todos puedan escribir')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('canal')
         .setDescription('Canal a desbloquear (por defecto: actual)')
         .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del desbloqueo').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['ManageChannels'],
  BOT_PERMISSIONS: ['ManageChannels'],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!targetChannel.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed('Solo puedo desbloquear canales de texto.')], flags: MessageFlags.Ephemeral });
    }

    const everyone = interaction.guild.roles.everyone;
    const botPerms = targetChannel.permissionsFor(interaction.guild.members.me);
    if (!botPerms.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('No tengo permisos para gestionar este canal.')], flags: MessageFlags.Ephemeral });
    }

    const currentPerms = targetChannel.permissionOverwrites.cache.get(everyone.id);
    if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ embeds: [errorEmbed(`${targetChannel} ya está desbloqueado.`)], flags: MessageFlags.Ephemeral });
    }

    try {
      await targetChannel.permissionOverwrites.edit(everyone, {
        SendMessages: null,
      }, { reason: `${interaction.user.tag}: ${reason}` });

      const description = block([
        kv('Canal', targetChannel),
        kv('Razón', reason),
        kv('Moderador', interaction.user),
      ]);

      const embed = createEmbed({
        color: COLORS.SUCCESS,
        title: '🔓 Canal desbloqueado',
        description,
        footer: {
          text: `Moderador: ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude desbloquear el canal: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};