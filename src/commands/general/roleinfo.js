import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv, bullets, formatNumber } from '../../utils/embedDecorations.js';

const PERMISSION_MAP = {
  Administrator: 'Administrador',
  KickMembers: 'Expulsar miembros',
  BanMembers: 'Banear miembros',
  ManageChannels: 'Gestionar canales',
  ManageGuild: 'Gestionar servidor',
  ManageMessages: 'Gestionar mensajes',
  ManageRoles: 'Gestionar roles',
  ManageNicknames: 'Gestionar apodos',
  ManageEmojisAndStickers: 'Gestionar emojis',
  ModerateMembers: 'Moderar miembros',
  MentionEveryone: 'Mencionar @everyone',
  SendMessages: 'Enviar mensajes',
  Connect: 'Conectarse a voz',
  Speak: 'Hablar en voz',
  MoveMembers: 'Mover miembros',
};

export default {
  CMD: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Muestra información detallada de un rol')
    .setDMPermission(false)
    .addRoleOption(opt =>
      opt.setName('rol')
         .setDescription('Rol a consultar')
         .setRequired(true)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const role = interaction.options.getRole('rol');

    const membersWithRole = interaction.guild.members.cache.filter(m =>
      m.roles.cache.has(role.id)
    );

    const shownMembers = membersWithRole.first(15);
    const membersText = shownMembers.length
      ? shownMembers.map(m => `<@${m.id}>`).join(' ')
      : '`Ninguno`';
    const extraMembers = membersWithRole.size > 15
      ? ` *+${membersWithRole.size - 15} más*`
      : '';

    const perms = role.permissions.toArray().filter(p => PERMISSION_MAP[p]);
    const permsText = perms.length ? bullets(perms.map(p => PERMISSION_MAP[p])) : '`Ninguno`';

    const colorHex = role.color
      ? `#${role.color.toString(16).padStart(6, '0')}`
      : '`Sin color`';

    const description = [
      header('🎭', 'Rol'),
      block([
        kv('Nombre', role.name),
        kv('ID', `\`${role.id}\``),
        kv('Color', `\`${colorHex.replace(/`/g, '')}\``),
        kv('Posición', `\`${role.position}\``),
        kv('Miembros', `\`${formatNumber(membersWithRole.size)}\``),
      ]),
      '',
      header('⚙️', 'Configuración'),
      block([
        kv('Mencionable', role.mentionable ? '`Sí`' : '`No`'),
        kv('Separado', role.hoist ? '`Sí`' : '`No`'),
        kv('Gestionable', role.editable ? '`Sí`' : '`No`'),
        kv('Integración', role.managed ? '`Sí`' : '`No`'),
      ]),
      '',
      header('🔑', 'Permisos destacados'),
      permsText,
      '',
      header('👥', 'Miembros con este rol'),
      `${membersText}${extraMembers}`,
    ].join('\n');

    const embed = createEmbed({
      color: role.color || COLORS.GENERAL,
      title: `🎭 ${role.name}`,
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};