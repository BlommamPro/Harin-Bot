import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv, formatRelativeTime } from '../../utils/embedDecorations.js';

const CHANNEL_TYPES = {
  [ChannelType.GuildText]: 'Texto',
  [ChannelType.GuildVoice]: 'Voz',
  [ChannelType.GuildCategory]: 'Categoría',
  [ChannelType.GuildAnnouncement]: 'Anuncios',
  [ChannelType.AnnouncementThread]: 'Hilo (Anuncios)',
  [ChannelType.PublicThread]: 'Hilo público',
  [ChannelType.PrivateThread]: 'Hilo privado',
  [ChannelType.GuildStageVoice]: 'Escenario',
  [ChannelType.GuildDirectory]: 'Directorio',
  [ChannelType.GuildForum]: 'Foro',
};

export default {
  CMD: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Muestra información detallada de un canal')
    .setDMPermission(false)
    .addChannelOption(opt =>
      opt.setName('canal')
         .setDescription('Canal a consultar (por defecto: este canal)')
         .setRequired(false)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    const typeName = CHANNEL_TYPES[channel.type] || 'Desconocido';

    const details = [];
    if (channel.isTextBased()) {
      const slowmode = channel.rateLimitPerUser || 0;
      const topic = channel.topic || '`Sin tema`';
      details.push(
        kv('Modo lento', slowmode > 0 ? `\`${slowmode}s\`` : '`Desactivado`'),
        kv('NSFW', channel.nsfw ? '`Sí`' : '`No`'),
        kv('Tema', topic.length > 100 ? topic.slice(0, 100) + '...' : topic)
      );
    }

    if (channel.isVoiceBased()) {
      details.push(
        kv('Bitrate', `\`${channel.bitrate / 1000} kbps\``),
        kv('Límite', `\`${channel.userLimit || 'Sin límite'}\``)
      );
    }

    const botPerms = channel.permissionsFor(interaction.guild.members.me);
    const canView = botPerms?.has('ViewChannel') || false;
    const canSend = botPerms?.has('SendMessages') || false;

    const description = [
      header('📢', 'Canal'),
      block([
        kv('Nombre', `#${channel.name}`),
        kv('ID', `\`${channel.id}\``),
        kv('Tipo', typeName),
        kv('Creado', formatRelativeTime(channel.createdTimestamp)),
        kv('Categoría', channel.parent ? `<#${channel.parentId}>` : '`Sin categoría`'),
        kv('Posición', `\`${channel.position}\``),
      ]),
      '',
      header('⚙️', 'Detalles'),
      block(details),
      '',
      header('🔑', 'Permisos del bot'),
      block([
        kv('Ver canal', canView ? '`Sí`' : '`No`'),
        kv('Enviar mensajes', canSend ? '`Sí`' : '`No`'),
      ]),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.GENERAL,
      title: `📢 #${channel.name}`,
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};