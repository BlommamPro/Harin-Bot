import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { clearEmbed } from '../../utils/embeds.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Borra mensajes de un canal')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('cantidad')
         .setDescription('Cantidad de mensajes a borrar (1-100)')
         .setRequired(true)
         .setMinValue(1)
         .setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Solo borrar mensajes de este usuario (opcional)').setRequired(false)
    )
    .addChannelOption(opt =>
      opt.setName('canal')
         .setDescription('Canal donde borrar (por defecto: canal actual)')
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(false)
    ),

  PERMISSIONS: ['ManageMessages'],
  BOT_PERMISSIONS: ['ManageMessages'],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const amount = interaction.options.getInteger('cantidad');
    const targetUser = interaction.options.getUser('usuario');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    if (!targetChannel.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed('Solo puedo borrar mensajes en canales de texto.')], flags: MessageFlags.Ephemeral });
    }

    const botPerms = targetChannel.permissionsFor(interaction.guild.members.me);
    if (!botPerms.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [errorEmbed('No tengo permiso para borrar mensajes en ese canal.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      let deletedCount = 0;

      if (targetUser) {
        const messages = await targetChannel.messages.fetch({ limit: 100 });
        const userMessages = Array.from(
          messages.filter(m => m.author.id === targetUser.id).values()
        ).slice(0, amount);

        if (userMessages.length === 0) {
          return interaction.editReply({
            embeds: [errorEmbed(`No encontré mensajes recientes de ${targetUser} en ${targetChannel}.`)],
          });
        }

        try {
          const deleted = await targetChannel.bulkDelete(userMessages, true);
          deletedCount = deleted.size;
        } catch {
          for (const msg of userMessages) {
            await msg.delete().catch(() => {});
            deletedCount++;
          }
        }
      } else {
        const deleted = await targetChannel.bulkDelete(amount, true);
        deletedCount = deleted.size;
      }

      const description = [
        header('🧹', 'Mensajes borrados'),
        block([
          kv('Canal', targetChannel),
          kv('Mensajes borrados', `\`${deletedCount}\``),
          targetUser ? kv('Filtrado por', targetUser) : null,
          kv('Moderador', interaction.user),
        ].filter(Boolean)),
      ].join('\n');

      const embed = clearEmbed(description);
      embed.setFooter({ text: `Moderador: ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ embeds: [errorEmbed(`Error al borrar mensajes: ${err.message}`)] });
    }
  },
};