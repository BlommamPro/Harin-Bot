import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Quita el timeout de un usuario')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a quitar el timeout').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['ModerateMembers'],
  BOT_PERMISSIONS: ['ModerateMembers'],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario en el servidor.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes quitarte el timeout a ti mismo.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes quitarme timeout a mí.')], flags: MessageFlags.Ephemeral });
    }
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('No puedes quitar timeout a alguien con un rol igual o superior al tuyo.')], flags: MessageFlags.Ephemeral });
    }
    if (!target.communicationDisabledUntilTimestamp || target.communicationDisabledUntilTimestamp <= Date.now()) {
      return interaction.reply({ embeds: [errorEmbed('Ese usuario no tiene un timeout activo.')], flags: MessageFlags.Ephemeral });
    }

    try {
      await target.timeout(null, `${interaction.user.tag}: ${reason}`);
      await addModLog(interaction.guildId, target.id, interaction.user.id, 'untimeout', reason);

      const description = [
        header('⏱️', 'Timeout removido'),
        block([
          kv('Usuario', `${target} (\`${target.id}\`)`),
          kv('Razón', reason),
          kv('Moderador', interaction.user),
        ]),
      ].join('\n');

      const embed = successEmbed(description);
      embed.setFooter({ text: `Moderador: ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() });
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude quitar el timeout: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};