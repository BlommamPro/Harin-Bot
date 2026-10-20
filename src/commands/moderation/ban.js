import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario del servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del ban').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['BanMembers'],
  BOT_PERMISSIONS: ['BanMembers'],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes banearte a ti mismo.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes banearme a mí.')], flags: MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario en el servidor.')], flags: MessageFlags.Ephemeral });
    }
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('No puedes banear a alguien con un rol igual o superior al tuyo.')], flags: MessageFlags.Ephemeral });
    }
    if (!member.bannable) {
      return interaction.reply({ embeds: [errorEmbed('No tengo permisos para banear a ese usuario.')], flags: MessageFlags.Ephemeral });
    }

    try {
      await member.ban({ reason: `${interaction.user.tag}: ${reason}` });
      await addModLog(interaction.guildId, target.id, interaction.user.id, 'ban', reason);

      const description = block([
        kv('Usuario', `${target.tag} (\`${target.id}\`)`),
        kv('Razón', reason),
        kv('Moderador', interaction.user),
      ]);

      const embed = createEmbed({
        color: COLORS.MODERATION,
        title: '🔨 Usuario baneado',
        description,
        footer: {
          text: `Moderador: ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude banear al usuario: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};