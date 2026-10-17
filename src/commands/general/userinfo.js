import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv, kvList, bullets, formatRelativeTime } from '../../utils/embedDecorations.js';

const STATUS_MAP = {
  online: '🟢 En línea',
  idle: '🟡 Ausente',
  dnd: '🔴 No molestar',
  offline: '⚫ Desconectado',
};

const ACTIVITY_TYPE_MAP = {
  0: 'Jugando',
  1: 'Transmitiendo',
  2: 'Escuchando',
  3: 'Viendo',
  4: 'Personalizado',
  5: 'Compitiendo en',
};

const KEY_PERMS = [
  'Administrator', 'ManageGuild', 'ManageChannels',
  'ManageMessages', 'KickMembers', 'BanMembers',
  'ManageRoles', 'ModerateMembers',
];

export default {
  CMD: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información detallada de un usuario')
    .setDMPermission(false)
    .addUserOption(opt =>
      opt.setName('usuario')
         .setDescription('Usuario a consultar (por defecto: tú)')
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
        embeds: [errorEmbed('No encontré a ese usuario en el servidor.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const status = member.presence?.status || 'offline';
    const activities = member.presence?.activities || [];

    let activityText = 'Sin actividad';
    if (activities.length > 0) {
      const a = activities[0];
      if (a.type === 4 && a.state) {
        activityText = `**${a.state}**`;
      } else {
        activityText = `**${ACTIVITY_TYPE_MAP[a.type] || 'Haciendo'}:** ${a.name}`;
      }
    }

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r);

    const shownRoles = roles.slice(0, 8);
    const rolesText = shownRoles.length
      ? shownRoles.map(r => `<@&${r.id}>`).join(' ')
      : '`Ninguno`';
    const extraRoles = roles.length > 8 ? ` *+${roles.length - 8} más*` : '';

    const perms = member.permissions.toArray();
    const hasPerms = KEY_PERMS.filter(p => perms.includes(p));
    const permsText = hasPerms.length ? bullets(hasPerms) : '`Ninguno`';

    const isSelf = target.id === interaction.user.id;

    const description = [
      header('👤', 'Usuario'),
      block([
        kv('Nombre', target.tag),
        kv('ID', `\`${target.id}\``),
        kv('Apodo', member.nickname || '`Sin apodo`'),
        kv('Bot', target.bot ? '`Sí`' : '`No`'),
      ]),
      '',
      header('📅', 'Fechas'),
      block([
        kv('Cuenta creada', formatRelativeTime(target.createdTimestamp)),
        kv('Se unió', member.joinedTimestamp ? formatRelativeTime(member.joinedTimestamp) : '`Desconocido`'),
      ]),
      '',
      header('📊', 'Estado'),
      block([
        kv('Presencia', STATUS_MAP[status] || status),
        kv('Actividad', activityText),
      ]),
      '',
      header('🎭', `Roles (${roles.length})`),
      `${rolesText}${extraRoles}`,
      '',
      header('🔑', 'Permisos destacados'),
      permsText,
    ].join('\n');

    const embed = createEmbed({
      color: member.displayColor || COLORS.GENERAL,
      title: isSelf ? '👤 Tu información' : `👤 ${member.displayName}`,
      thumbnail: target.displayAvatarURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};