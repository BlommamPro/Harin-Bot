import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón de la expulsión').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['KickMembers'],
  BOT_PERMISSIONS: ['KickMembers'],
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
      return interaction.reply({ embeds: [errorEmbed('No puedes expulsarte a ti mismo.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes expulsarme a mí.')], flags: MessageFlags.Ephemeral });
    }
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('No puedes expulsar a alguien con un rol igual o superior al tuyo.')], flags: MessageFlags.Ephemeral });
    }
    if (!target.kickable) {
      return interaction.reply({ embeds: [errorEmbed('No puedo expulsar a ese usuario.')], flags: MessageFlags.Ephemeral });
    }

    try {
      await target.kick(`${interaction.user.tag}: ${reason}`);
      await addModLog(interaction.guildId, target.id, interaction.user.id, 'kick', reason);

      const description = block([
        kv('Usuario', `${target.user.tag} (\`${target.id}\`)`),
        kv('Razón', reason),
        kv('Moderador', interaction.user),
      ]);

      const embed = createEmbed({
        color: COLORS.MODERATION,
        title: '👢 Usuario expulsado',
        description,
        footer: {
          text: `Moderador: ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude expulsar al usuario: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};