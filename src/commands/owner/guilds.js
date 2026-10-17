import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, COLORS } from '../../utils/embeds.js';

const ITEMS_PER_PAGE = 10;

export default {
  CMD: new SlashCommandBuilder()
    .setName('guilds')
    .setDescription('Panel de gestión de servidores (solo owner)')
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
           opt.setName('id')
              .setDescription('ID del servidor')
              .setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('leave')
         .setDescription('Salir de un servidor (¡CUIDADO!)')
         .addStringOption(opt =>
           opt.setName('id')
              .setDescription('ID del servidor')
              .setRequired(true)
         )
         .addBooleanOption(opt =>
           opt.setName('confirmar')
              .setDescription('Escribe "true" para confirmar')
              .setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('search')
         .setDescription('Buscar un servidor por nombre o ID')
         .addStringOption(opt =>
           opt.setName('query')
              .setDescription('Nombre o ID del servidor')
              .setRequired(true)
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
           opt.setName('id')
              .setDescription('ID del servidor')
              .setRequired(true)
         )
         .addStringOption(opt =>
           opt.setName('mensaje')
              .setDescription('Mensaje a enviar')
              .setRequired(true)
              .setMaxLength(2000)
         )
         .addStringOption(opt =>
           opt.setName('canal')
              .setDescription('ID del canal (opcional, usa el general por defecto)')
              .setRequired(false)
         )
    ),

  OWNER: true,
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  COOLDOWN: 5,
  GUILD_ONLY: false,

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const order = interaction.options.getString('orden') || 'recent';
      let guilds = Array.from(client.guilds.cache.values());

      if (guilds.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('El bot no está en ningún servidor.')],
          flags: MessageFlags.Ephemeral
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
              `ID: \`${g.id}\``,
              `**${g.memberCount}** miembros`,
              `Dueño: ${owner ? owner.tag : 'Desconocido'}`,
              `Unido: <t:${Math.floor(g.joinedTimestamp / 1000)}:R>`
            ].join('\n'),
            inline: false
          };
        });

        const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);

        return createEmbed({
          color: COLORS.OWNER,
          title: `Servidores del bot (${guilds.length})`,
          description: [
            `**Total de miembros:** ${totalMembers.toLocaleString()}`,
            `**Ordenado por:** ${order}`,
            `**Página ${page + 1} de ${totalPages}**`,
            '',
            `Comandos útiles:`,
            `• \`/guilds info <id>\` - Ver detalles de un servidor`,
            `• \`/guilds leave <id>\` - Salir de un servidor`,
            `• \`/guilds search <nombre>\` - Buscar un servidor`
          ].join('\n'),
          fields: fields,
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL()
          }
        });
      };

      const generateButtons = (page) => {
        const row = new ActionRowBuilder();

        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`guilds_list_prev_${interaction.user.id}`)
            .setLabel('Anterior')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`guilds_list_next_${interaction.user.id}`)
            .setLabel('Siguiente')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1)
        );

        return row;
      };

      await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [generateButtons(currentPage)] : [],
        flags: MessageFlags.Ephemeral
      });

      if (totalPages <= 1) return;

      const message = await interaction.fetchReply();

      const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 120000
      });

      collector.on('collect', async (i) => {
        if (i.customId.includes('prev')) {
          currentPage = Math.max(0, currentPage - 1);
        } else if (i.customId.includes('next')) {
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)]
        });
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch { /* ignorar */ }
      });
    }

    if (sub === 'info') {
      const guildId = interaction.options.getString('id');
      const guild = client.guilds.cache.get(guildId);

      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor con ID: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral
        });
      }

      const owner = await client.users.fetch(guild.ownerId).catch(() => null);
      const botMember = guild.members.me;
      const botPermissions = botMember ? botMember.permissions.toArray() : [];

      const channels = guild.channels.cache;
      const textChannels = channels.filter(c => c.isTextBased()).size;
      const voiceChannels = channels.filter(c => c.isVoiceBased()).size;

      const { GuildLevel } = await import('../../models/GuildLevel.js');
      const { Warn } = await import('../../models/Warn.js');
      const { Giveaway } = await import('../../models/Giveaway.js');

      const levelCount = await GuildLevel.countDocuments({ guildId: guild.id });
      const warnCount = await Warn.countDocuments({ guildId: guild.id });
      const giveawayCount = await Giveaway.countDocuments({ guildId: guild.id, ended: false });

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `Información de ${guild.name}`,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        description: [
          `**Nombre:** ${guild.name}`,
          `**ID:** \`${guild.id}\``,
          `**Dueño:** ${owner ? owner.tag : 'Desconocido'} (\`${guild.ownerId}\`)`,
          `**Creado:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          `**Bot unido:** <t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`,
          '',
          `**Estadísticas del servidor**`,
          `**Miembros:** ${guild.memberCount}`,
          `**Bots:** ${guild.members.cache.filter(m => m.user.bot).size}`,
          `**Canales:** ${channels.size} (${textChannels} texto, ${voiceChannels} voz)`,
          `**Roles:** ${guild.roles.cache.size}`,
          `**Emojis:** ${guild.emojis.cache.size}`,
          '',
          `**Datos en base de datos**`,
          `**Niveles registrados:** ${levelCount}`,
          `**Warns:** ${warnCount}`,
          `**Sorteos activos:** ${giveawayCount}`,
          '',
          `**Permisos del bot (${botPermissions.length})**`,
          botPermissions.length > 0 
            ? botPermissions.slice(0, 8).map(p => `• ${p}`).join('\n') + (botPermissions.length > 8 ? `\n• ... y ${botPermissions.length - 8} más` : '')
            : 'No se pudieron obtener los permisos'
        ].join('\n'),
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'leave') {
      const guildId = interaction.options.getString('id');
      const confirm = interaction.options.getBoolean('confirmar');

      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('Debes confirmar con `confirmar:true` para salir del servidor.')],
          flags: MessageFlags.Ephemeral
        });
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor con ID: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral
        });
      }

      if (client.guilds.cache.size <= 1) {
        return interaction.reply({
          embeds: [errorEmbed('No puedes salir del último servidor. El bot necesita estar en al menos un servidor.')],
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        await guild.leave();
        
        return interaction.reply({
          embeds: [successEmbed(
            `He salido del servidor **${guild.name}** (\`${guildId}\`)\n` +
            `Servidores restantes: ${client.guilds.cache.size}`
          )]
        });
      } catch (err) {
        return interaction.reply({
          embeds: [errorEmbed(`No pude salir del servidor: ${err.message}`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (sub === 'search') {
      const query = interaction.options.getString('query').toLowerCase();
      const guilds = Array.from(client.guilds.cache.values());

      const results = guilds.filter(g => 
        g.name.toLowerCase().includes(query) || 
        g.id.includes(query)
      );

      if (results.length === 0) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré ningún servidor que coincida con: \`${query}\``)],
          flags: MessageFlags.Ephemeral
        });
      }

      const fields = results.slice(0, 25).map(g => ({
        name: g.name,
        value: [
          `ID: \`${g.id}\``,
          `**${g.memberCount}** miembros`,
          `Dueño: <@${g.ownerId}>`,
          `Unido: <t:${Math.floor(g.joinedTimestamp / 1000)}:R>`
        ].join('\n'),
        inline: true
      }));

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: `Resultados de búsqueda: "${query}"`,
        description: `Encontrados **${results.length}** servidores${results.length > 25 ? ' (mostrando 25)' : ''}`,
        fields: fields,
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

      const embed = createEmbed({
        color: COLORS.OWNER,
        title: 'Estadísticas globales del bot',
        thumbnail: client.user.displayAvatarURL({ size: 256 }),
        description: [
          `**Discord**`,
          `**Servidores:** ${guilds.length}`,
          `**Miembros totales:** ${totalMembers.toLocaleString()}`,
          `**Bots totales:** ${totalBots.toLocaleString()}`,
          `**Usuarios humanos:** ${(totalMembers - totalBots).toLocaleString()}`,
          '',
          `**Servidores por tamaño**`,
          `• Menos de 50 miembros: ${smallGuilds}`,
          `• Entre 50 y 500 miembros: ${mediumGuilds}`,
          `• Más de 500 miembros: ${largeGuilds}`,
          '',
          `**Base de datos**`,
          `**Usuarios registrados:** ${userCount}`,
          `**Niveles totales:** ${levelCount}`,
          `**Warns totales:** ${warnCount}`,
          `**Sorteos activos:** ${giveawayCount}`,
          '',
          `**Rendimiento**`,
          `**Ping:** ${client.ws.ping}ms`,
          `**Uptime:** ${formatUptime(client.uptime)}`,
          `**RAM:** ${formatBytes(process.memoryUsage().rss)}`
        ].join('\n'),
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'announce') {
      const guildId = interaction.options.getString('id');
      const message = interaction.options.getString('mensaje');
      const channelId = interaction.options.getString('canal');

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré el servidor con ID: \`${guildId}\``)],
          flags: MessageFlags.Ephemeral
        });
      }

      let targetChannel = null;
      if (channelId) {
        targetChannel = guild.channels.cache.get(channelId);
        if (!targetChannel) {
          return interaction.reply({
            embeds: [errorEmbed(`No encontré el canal con ID: \`${channelId}\` en ${guild.name}`)],
            flags: MessageFlags.Ephemeral
          });
        }
      } else {
        targetChannel = guild.channels.cache.find(c => 
          c.isTextBased() && 
          (c.name === 'general' || c.name === 'general-chat' || c.name === 'chat')
        ) || guild.channels.cache.find(c => c.isTextBased());
      }

      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.reply({
          embeds: [errorEmbed(`No encontré un canal de texto válido en ${guild.name}`)],
          flags: MessageFlags.Ephemeral
        });
      }

      const botPerms = targetChannel.permissionsFor(guild.members.me);
      if (!botPerms.has('SendMessages') || !botPerms.has('EmbedLinks')) {
        return interaction.reply({
          embeds: [errorEmbed(`No tengo permisos para enviar mensajes en ${targetChannel}`)],
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        const embed = createEmbed({
          color: COLORS.OWNER,
          title: 'Anuncio del dueño',
          description: message,
          footer: {
            text: `Enviado por ${interaction.user.tag}`,
            icon: interaction.user.displayAvatarURL()
          }
        });

        await targetChannel.send({ embeds: [embed] });

        return interaction.reply({
          embeds: [successEmbed(`Mensaje enviado a **${guild.name}** en ${targetChannel}`)],
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        return interaction.reply({
          embeds: [errorEmbed(`No pude enviar el mensaje: ${err.message}`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};

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