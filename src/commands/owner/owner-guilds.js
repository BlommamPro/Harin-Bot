import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';

const ITEMS_PER_PAGE = 10;

export default {
  CMD: new SlashCommandBuilder()
    .setName('owner-guilds')
    .setDescription('👑 Gestión de servidores del bot (solo owner)')
    .setDMPermission(true)
    .addSubcommand(sub =>
      sub.setName('list')
         .setDescription('Listar todos los servidores del bot')
         .addStringOption(opt =>
           opt.setName('orden')
              .setDescription('Ordenar por')
              .setRequired(false)
              .addChoices(
                { name: 'Más reciente', value: 'recent' },
                { name: 'Más miembros', value: 'members' },
                { name: 'Alfabético (A-Z)', value: 'alphabetical' }
              )
         )
    )
    .addSubcommand(sub =>
      sub.setName('info')
         .setDescription('Ver información detallada de un servidor')
         .addStringOption(opt =>
           opt.setName('id').setDescription('ID del servidor').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('leave')
         .setDescription('Salir de un servidor (¡CUIDADO!)')
         .addStringOption(opt =>
           opt.setName('id').setDescription('ID del servidor').setRequired(true)
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar').setDescription('Escribe "true" para confirmar').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('search')
         .setDescription('Buscar un servidor por nombre o ID')
         .addStringOption(opt =>
           opt.setName('query').setDescription('Nombre o ID del servidor').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('stats')
         .setDescription('Ver estadísticas globales del bot')
    )
    .addSubcommand(sub =>
      sub.setName('announce')
         .setDescription('Enviar un anuncio a un servidor específico')
         .addStringOption(opt =>
           opt.setName('id').setDescription('ID del servidor').setRequired(true)
         )
         .addStringOption(opt =>
           opt.setName('mensaje').setDescription('Mensaje a enviar').setRequired(true).setMaxLength(2000)
         )
         .addStringOption(opt =>
           opt.setName('canal').setDescription('ID del canal (opcional)').setRequired(false)
         )
    ),

  OWNER: true,
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const order = interaction.options.getString('orden') || 'recent';
      let guilds = Array.from(client.guilds.cache.values());

      if (guilds.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('El bot no está en ningún servidor.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      switch (order) {
        case 'recent':
          guilds.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);
          break;
        case 'members':
          guilds.sort((a, b) => b.memberCount - a.memberCount);
          break;
        case 'alphabetical':
          guilds.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      const totalPages = Math.ceil(guilds.length / ITEMS_PER_PAGE);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageGuilds = guilds.slice(start, end);

        const fields = pageGuilds.map((g, i) => {
          const owner = client.users.cache.get(g.ownerId);
          return {
            name: `${start + i + 1}. ${g.name}`,
            value: [
              `> ID: \`${g.id}\``,
              `> **${formatNumber(g.memberCount)}** miembros`,
              `> Dueño: ${owner ? owner.tag : 'Desconocido'}`,
              `> Unido: <t:${Math.floor(g.joinedTimestamp / 1000)}:R>`,
            ].join('\n'),
            inline: false,
          };
        });

        const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);

        return createEmbed({
          color: COLORS.OWNER,
          title: `👑 Servidores del bot (${formatNumber(guilds.length)})`,
          description: [
            block([
              kv('Total de miembros', `\`${formatNumber(totalMembers)}\``),
              kv('Ordenado por', `\`${order}\``),
              kv('Página', `\`${page + 1} / ${totalPages}\``),
            ]),
          ].join('\n'),
          fields,
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL(),
          },
        });
      };

      const generateButtons = (page) => {
        const row = new ActionRowBuilder();
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`og_prev_${interaction.user.id}`)
            .setLabel('Anterior')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`og_next_${interaction.user.id}`)
            .setLabel('Siguiente')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1)
        );
        return row;
      };

      await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [generateButtons(currentPage)] : [],
        flags: MessageFlags.Ephemeral,
      });

      if (totalPages <= 1) return;

      const message = await interaction.fetchReply();

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120000,
      });

      collector.on('collect', async (i) => {
        if (i.customId.includes('prev')) currentPage = Math.max(0, currentPage - 1);
        else if (i.customId.includes('next')) currentPage = Math.min(totalPages - 1, currentPage + 1);

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      collector.on('end', async () => {
        try { await interaction.editReply({ components: [] }); } catch { /* ignorar */ }
      });
    }

    if (sub === 'info') {
      const guildId = interaction.options.getString('id');
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor con ID: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const owner = await client.users.fetch(guild.ownerId).catch(() => null);
      const botPermissions = guild.members.me ? guild.members.me.permissions.toArray() : [];
      const channels = guild.channels.cache;
      const textChannels = channels.filter(c => c.isTextBased()).size;
      const voiceChannels = channels.filter(c => c.isVoiceBased()).size;

      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');
      const { Giveaway } = await import('../../models/Giveaway.js');

      const levelCount = await GuildLevel.countDocuments({ guildId: guild.id });
      const warnCount = await Warn.countDocuments({ guildId: guild.id });
      const giveawayCount = await Giveaway.countDocuments({ guildId: guild.id, ended: false });

      const permText = botPermissions.length > 0
        ? botPermissions.slice(0, 8).map(p => `> • ${p}`).join('\n') +
          (botPermissions.length > 8 ? `\n> • ... y ${botPermissions.length - 8} más` : '')
        : '> No se pudieron obtener los permisos';

      const description = [
        block([
          kv('Nombre', guild.name),
          kv('ID', `\`${guild.id}\``),
          kv('Dueño', owner ? `${owner.tag} (\`${guild.ownerId}\`)` : `\`${guild.ownerId}\``),
          kv('Creado', `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`),
          kv('Bot unido', `<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`),
        ]),
        '',
        '**📊 Estadísticas**',
        block([
          kv('Miembros', `\`${formatNumber(guild.memberCount)}\``),
          kv('Bots', `\`${formatNumber(guild.members.cache.filter(m => m.user.bot).size)}\``),
          kv('Canales', `\`${channels.size}\` (${textChannels} texto, ${voiceChannels} voz)`),
          kv('Roles', `\`${formatNumber(guild.roles.cache.size)}\``),
          kv('Emojis', `\`${formatNumber(guild.emojis.cache.size)}\``),
        ]),
        '',
        '**🗄️ Datos en DB**',
        block([
          kv('Niveles', `\`${formatNumber(levelCount)}\``),
          kv('Warns', `\`${formatNumber(warnCount)}\``),
          kv('Sorteos activos', `\`${formatNumber(giveawayCount)}\``),
        ]),
        '',
        `**🔑 Permisos del bot (${botPermissions.length})**`,
        permText,
      ].join('\n');

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `👑 ${guild.name}`,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        description,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'leave') {
      const guildId = interaction.options.getString('id');
      const confirm = interaction.options.getBoolean('confirmar');

      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('Debes confirmar con `confirmar:true`.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor con ID: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (client.guilds.cache.size <= 1) {
        return interaction.reply({
          embeds: [errorEmbed('No puedes salir del último servidor.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await guild.leave();
        return interaction.reply({
          embeds: [createEmbed({
            color: COLORS.SUCCESS,
            title: '✅ Servidor abandonado',
            description: block([
              kv('Servidor', guild.name),
              kv('ID', `\`${guildId}\``),
              kv('Servidores restantes', `\`${client.guilds.cache.size}\``),
            ]),
          })],
        });
      } catch (err) {
        return interaction.reply({
          embeds: [errorEmbed(`No pude salir: ${err.message}`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (sub === 'search') {
      const query = interaction.options.getString('query').toLowerCase();
      const results = Array.from(client.guilds.cache.values()).filter(g =>
        g.name.toLowerCase().includes(query) || g.id.includes(query)
      );

      if (results.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré servidores con: \`${query}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const fields = results.slice(0, 25).map(g => ({
        name: g.name,
        value: [
          `> ID: \`${g.id}\``,
          `> **${formatNumber(g.memberCount)}** miembros`,
          `> Dueño: <@${g.ownerId}>`,
          `> Unido: <t:${Math.floor(g.joinedTimestamp / 1000)}:R>`,
        ].join('\n'),
        inline: true,
      }));

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.OWNER,
          title: `🔍 Resultados: "${query}"`,
          description: `Encontrados **${results.length}** servidores${results.length > 25 ? ' (mostrando 25)' : ''}`,
          fields,
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL(),
          },
        })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === 'stats') {
      const guilds = Array.from(client.guilds.cache.values());
      const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);
      const totalBots = guilds.reduce((sum, g) => sum + g.members.cache.filter(m => m.user.bot).size, 0);

      const smallGuilds = guilds.filter(g => g.memberCount < 50).length;
      const mediumGuilds = guilds.filter(g => g.memberCount >= 50 && g.memberCount < 500).length;
      const largeGuilds = guilds.filter(g => g.memberCount >= 500).length;

      const { User } = await import('../../models/User.js');
      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');
      const { Giveaway } = await import('../../models/Giveaway.js');

      const userCount = await User.countDocuments();
      const levelCount = await GuildLevel.countDocuments();
      const warnCount = await Warn.countDocuments();
      const giveawayCount = await Giveaway.countDocuments({ ended: false });

      const description = [
        '**🌐 Discord**',
        block([
          kv('Servidores', `\`${formatNumber(guilds.length)}\``),
          kv('Miembros totales', `\`${formatNumber(totalMembers)}\``),
          kv('Bots totales', `\`${formatNumber(totalBots)}\``),
          kv('Humanos', `\`${formatNumber(totalMembers - totalBots)}\``),
        ]),
        '',
        '**📊 Servidores por tamaño**',
        block([
          kv('Menos de 50', `\`${smallGuilds}\``),
          kv('Entre 50 y 500', `\`${mediumGuilds}\``),
          kv('Más de 500', `\`${largeGuilds}\``),
        ]),
        '',
        '**🗄️ Base de datos**',
        block([
          kv('Usuarios', `\`${formatNumber(userCount)}\``),
          kv('Niveles', `\`${formatNumber(levelCount)}\``),
          kv('Warns', `\`${formatNumber(warnCount)}\``),
          kv('Sorteos activos', `\`${formatNumber(giveawayCount)}\``),
        ]),
        '',
        '**⚙️ Rendimiento**',
        block([
          kv('Ping', `\`${client.ws.ping}ms\``),
          kv('RAM', `\`${formatBytes(process.memoryUsage().rss)}\``),
        ]),
      ].join('\n');

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.OWNER,
          title: '👑 Estadísticas globales',
          thumbnail: client.user.displayAvatarURL({ size: 256 }),
          description,
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL(),
          },
        })],
      });
    }

    if (sub === 'announce') {
      const guildId = interaction.options.getString('id');
      const message = interaction.options.getString('mensaje');
      const channelId = interaction.options.getString('canal');

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }

      let targetChannel = null;
      if (channelId) {
        targetChannel = guild.channels.cache.get(channelId);
        if (!targetChannel) {
          return interaction.reply({
            embeds: [errorEmbed(`No encontré el canal: \`${channelId}\``)],
            flags: MessageFlags.Ephemeral,
          });
        }
      } else {
        targetChannel = guild.channels.cache.find(c =>
          c.isTextBased() && ['general', 'general-chat', 'chat'].includes(c.name)
        ) || guild.channels.cache.find(c => c.isTextBased());
      }

      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.reply({
          embeds: [errorEmbed(`No hay canal de texto válido en ${guild.name}`)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const botPerms = targetChannel.permissionsFor(guild.members.me);
      if (!botPerms.has('SendMessages') || !botPerms.has('EmbedLinks')) {
        return interaction.reply({
          embeds: [errorEmbed(`No tengo permisos en ${targetChannel}`)],
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        const embed = createEmbed({
          color: COLORS.OWNER,
          title: '📢 Anuncio del owner',
          description: message,
          footer: {
            text: `Enviado por ${interaction.user.tag}`,
            icon: interaction.user.displayAvatarURL(),
          },
        });

        await targetChannel.send({ embeds: [embed] });

        return interaction.reply({
          embeds: [createEmbed({
            color: COLORS.SUCCESS,
            title: '✅ Anuncio enviado',
            description: block([
              kv('Servidor', guild.name),
              kv('Canal', targetChannel.toString()),
            ]),
          })],
          flags: MessageFlags.Ephemeral,
        });
      } catch (err) {
        return interaction.reply({
          embeds: [errorEmbed(`No pude enviar: ${err.message}`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}