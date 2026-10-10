import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Muestra información detallada de un usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario')
         .setDescription('Usuario a consultar (opcional, por defecto tú)')
         .setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild.members.cache.get(target.id);
    
    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('❌ No encontré a ese usuario en el servidor.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const statusMap = {
      online: '🟢 En línea',
      idle: '🟡 Ausente',
      dnd: '🔴 No molestar',
      offline: '⚫ Desconectado'
    };

    const status = member.presence?.status || 'offline';
    const activities = member.presence?.activities || [];
    const activityText = activities.length > 0 
      ? activities.map(a => `**${a.type}:** ${a.name}`).join('\n')
      : 'Ninguna';

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r)
      .slice(0, 10);
    
    const rolesText = roles.length > 0 
      ? roles.map(r => `<@&${r.id}>`).join(' ')
      : 'Ninguno';
    const rolesCount = member.roles.cache.size - 1;

    const permissions = member.permissions.toArray();
    const keyPermissions = [
      'Administrator', 'ManageServer', 'ManageChannels', 
      'ManageMessages', 'KickMembers', 'BanMembers',
      'ManageRoles', 'ModerateMembers'
    ];
    const hasPerms = keyPermissions.filter(p => permissions.includes(p));

    const isSelf = target.id === interaction.user.id;

    const embed = createEmbed({
      color: member.displayColor || COLORS.GENERAL,
      title: isSelf ? '👤 Tu Información' : `👤 ${member.displayName}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description: [
        `**📛 Usuario:** ${target.tag}`,
        `**🆔 ID:** \`${target.id}\``,
        `**💬 Apodo:** ${member.nickname || 'Ninguno'}`,
        `**📅 Cuenta creada:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
        `**📅 Unido:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        '',
        `**📊 Estado**`,
        `🔹 **Estado:** ${statusMap[status] || status}`,
        `🔹 **Actividad:** ${activityText}`,
        '',
        `**🎭 Roles (${rolesCount})**`,
        rolesText || 'Ninguno',
        '',
        `**🔑 Permisos clave**`,
        hasPerms.length > 0 ? `• ${hasPerms.join(' • ')}` : 'Ninguno destacado'
      ].join('\n'),
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};