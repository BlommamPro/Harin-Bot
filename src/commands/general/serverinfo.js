import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv, formatRelativeTime, formatNumber } from '../../utils/embedDecorations.js';

const VERIFICATION_LEVELS = {
  NONE: 'Ninguno',
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  VERY_HIGH: 'Muy alto',
};

export default {
  CMD: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información detallada del servidor')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const guild = interaction.guild;

    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.isTextBased()).size;
    const voiceChannels = channels.filter(c => c.isVoiceBased()).size;
    const categories = channels.filter(c => c.type === 4).size;

    const description = [
      header('🏠', 'Servidor'),
      block([
        kv('Nombre', guild.name),
        kv('ID', `\`${guild.id}\``),
        kv('Dueño', `<@${guild.ownerId}>`),
        kv('Creado', formatRelativeTime(guild.createdTimestamp)),
        kv(`${client.user.username} se unió`, formatRelativeTime(guild.joinedTimestamp)),
      ]),
      '',
      header('👥', 'Miembros'),
      block([
        kv('Total', `\`${formatNumber(totalMembers)}\``),
        kv('Humanos', `\`${formatNumber(humanCount)}\``),
        kv('Bots', `\`${formatNumber(botCount)}\``),
        kv('En línea', `\`${formatNumber(onlineMembers)}\``),
      ]),
      '',
      header('📢', 'Canales'),
      block([
        kv('Total', `\`${formatNumber(channels.size)}\``),
        kv('Texto', `\`${formatNumber(textChannels)}\``),
        kv('Voz', `\`${formatNumber(voiceChannels)}\``),
        kv('Categorías', `\`${formatNumber(categories)}\``),
      ]),
      '',
      header('🎨', 'Recursos'),
      block([
        kv('Roles', `\`${formatNumber(guild.roles.cache.size)}\``),
        kv('Emojis', `\`${formatNumber(guild.emojis.cache.size)}\``),
        kv('Stickers', `\`${formatNumber(guild.stickers.cache.size)}\``),
      ]),
      '',
      header('🔒', 'Configuración'),
      block([kv('Verificación', VERIFICATION_LEVELS[guild.verificationLevel] || 'Desconocido')]),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.GENERAL,
      title: `🏠 ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};