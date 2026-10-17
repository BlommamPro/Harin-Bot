import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Desbanea a un usuario del servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt =>
      opt.setName('id').setDescription('ID del usuario baneado').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del desbaneo').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['BanMembers'],
  BOT_PERMISSIONS: ['BanMembers'],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const userId = interaction.options.getString('id').trim();
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ embeds: [errorEmbed('Debes proporcionar una ID de usuario válida.')], flags: MessageFlags.Ephemeral });
    }

    const banList = await interaction.guild.bans.fetch().catch(() => null);
    if (!banList || !banList.has(userId)) {
      return interaction.reply({ embeds: [errorEmbed('Ese usuario no está baneado en este servidor.')], flags: MessageFlags.Ephemeral });
    }

    const bannedUser = banList.get(userId).user;

    try {
      await interaction.guild.bans.remove(userId, `${interaction.user.tag}: ${reason}`);
      await addModLog(interaction.guildId, userId, interaction.user.id, 'unban', reason);

      const description = [
        header('🔓', 'Usuario desbaneado'),
        block([
          kv('Usuario', `${bannedUser.tag} (\`${bannedUser.id}\`)`),
          kv('Razón', reason),
          kv('Moderador', interaction.user),
        ]),
      ].join('\n');

      const embed = successEmbed(description);
      embed.setFooter({ text: `Moderador: ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() });
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude desbanear al usuario: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};