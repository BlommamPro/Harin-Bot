import { SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { createEmbed, COLORS } from '../../utils/embeds.js';
import { config } from '../../../config/config.js';
import { header, block, kv, formatNumber, formatDuration } from '../../utils/embedDecorations.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Muestra información del bot'),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    let version = '1.0.0';
    try {
      const pkgPath = join(__dirname, '../../../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      version = pkg.version;
    } catch { /* ignorar */ }

    const mem = process.memoryUsage();
    const owners = config.ownerIds.length
      ? config.ownerIds.map(id => `<@${id}>`).join(', ')
      : '`No configurado`';

    const description = [
      `**${client.user.username}** — bot multifuncional con economía, niveles, moderación y sorteos.`,
      '',
      header('🤖', 'General'),
      block([
        kv('Versión', `\`v${version}\``),
        kv('Uptime', `\`${formatDuration(client.uptime)}\``),
        kv('Ping', `\`${client.ws.ping}ms\``),
        kv('Creado', `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`),
      ]),
      '',
      header('🌐', 'Alcance'),
      block([
        kv('Servidores', `\`${formatNumber(client.guilds.cache.size)}\``),
        kv('Usuarios', `\`${formatNumber(client.users.cache.size)}\``),
        kv('Canales', `\`${formatNumber(client.channels.cache.size)}\``),
        kv('Comandos', `\`${formatNumber(client.slashCommands.size)}\``),
      ]),
      '',
      header('⚙️', 'Tecnología'),
      block([
        kv('Node.js', `\`${process.version}\``),
        kv('discord.js', `\`v${djsVersion}\``),
        kv('RAM (heap)', `\`${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}\``),
        kv('RAM (RSS)', `\`${formatBytes(mem.rss)}\``),
      ]),
      '',
      header('👑', 'Desarrollo'),
      block([kv('Owner(s)', owners)]),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.INFO,
      title: `ℹ️ ${client.user.username}`,
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 256 }),
      description,
      footer: {
        text: `Solicitado por ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};