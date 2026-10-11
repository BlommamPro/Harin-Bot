import { SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { createEmbed, COLORS, BRANDING } from '../../utils/embeds.js';
import { config } from '../../../config/config.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { emojis } from '../../utils/emojis.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (mins % 60 > 0) parts.push(`${mins % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ') || '0s';
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Muestra informacion del bot'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction, guildData, userData) {
    let version = '1.0.0';
    try {
      const pkgPath = join(__dirname, '../../../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      version = pkg.version;
    } catch { /* ignorar */ }

    const uptime = formatUptime(client.uptime);
    const memoryUsage = process.memoryUsage();
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.users.cache.size;
    const totalChannels = client.channels.cache.size;
    const totalCommands = client.slashCommands.size;
    const nodeVersion = process.version;

    const embed = createEmbed({
      color: COLORS.INFO,
      title: `${emojis.harin} ${client.user.username}`,
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 256 }),
      description: `${emojis.infor} **${client.user.username}** es un bot multifuncional con economía, niveles, moderación, sorteos y más.`,
      fields: [
        { name: '📦 Versión', value: `\`v${version}\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true },
        { name: '📡 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
        { name: '🏘️ Servidores', value: `\`${totalGuilds}\``, inline: true },
        { name: '👥 Usuarios', value: `\`${totalUsers}\``, inline: true },
        { name: '📋 Canales', value: `\`${totalChannels}\``, inline: true },
        { name: '⌨️ Comandos', value: `\`${totalCommands}\``, inline: true },
        { name: '💻 Node.js', value: `\`${nodeVersion}\``, inline: true },
        { name: '📚 discord.js', value: `\`v${djsVersion}\``, inline: true },
        { name: '🧠 RAM (Heap)', value: `\`${formatBytes(memoryUsage.heapUsed)} / ${formatBytes(memoryUsage.heapTotal)}\``, inline: true },
        { name: '🧠 RAM (RSS)', value: `\`${formatBytes(memoryUsage.rss)}\``, inline: true },
        { name: '👑 Owner(s)', value: config.ownerIds.length > 0 ? config.ownerIds.map(id => `<@${id}>`).join(', ') : 'No configurado', inline: false },
        { name: '📅 Creado', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true }
      ],
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL()
      }
    });

    await interaction.reply({ embeds: [embed] });
  }
};