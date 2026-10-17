import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, successEmbed, COLORS } from '../../utils/embeds.js';
import { header, block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { Giveaway } from '../../models/Giveaway.js';
import { parseTime } from '../../utils/parseTime.js';
import { getLevelConfig } from '../../utils/levelSystem.js';

function generateGiveawayId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Crea un sorteo en el servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(opt =>
      opt.setName('premio').setDescription('Qué se sortea').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duracion').setDescription('Duración: 1h, 1d, 30m, etc.').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('ganadores').setDescription('Cantidad de ganadores').setRequired(false).setMinValue(1).setMaxValue(10)
    )
    .addRoleOption(opt =>
      opt.setName('rol').setDescription('Rol requerido para participar (opcional)').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('nivel').setDescription('Nivel mínimo requerido para participar (opcional)').setRequired(false).setMinValue(1).setMaxValue(100)
    )
    .addStringOption(opt =>
      opt.setName('tipo_nivel').setDescription('Tipo de nivel (global o servidor)').setRequired(false)
        .addChoices(
          { name: 'Global', value: 'global' },
          { name: 'Servidor', value: 'guild' }
        )
    ),

  PERMISSIONS: ['ManageEvents'],
  BOT_PERMISSIONS: ['AddReactions', 'EmbedLinks'],
  OWNER: false,
  COOLDOWN: 10,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const prize = interaction.options.getString('premio');
    const durationStr = interaction.options.getString('duracion');
    const winnerCount = interaction.options.getInteger('ganadores') || 1;

    const requiredRole = interaction.options.getRole('rol');
    const requiredLevel = interaction.options.getInteger('nivel');
    const levelType = interaction.options.getString('tipo_nivel') || 'guild';

    const parsed = parseTime(durationStr);
    if (!parsed) {
      return interaction.reply({
        embeds: [errorEmbed('Formato de tiempo inválido. Usa: `1h`, `30m`, `1d`, `2d12h`...')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (requiredLevel) {
      const levelConfig = await getLevelConfig(interaction.guildId);
      if (!levelConfig.enabled) {
        return interaction.reply({
          embeds: [errorEmbed('El sistema de niveles no está activo en este servidor. No se puede requerir nivel.')],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    const activeGiveaways = await Giveaway.countDocuments({
      guildId: interaction.guildId,
      ended: false,
    });

    const MAX_GIVEAWAYS = 3;

    if (activeGiveaways >= MAX_GIVEAWAYS) {
      return interaction.reply({
        embeds: [errorEmbed(
          `Límite de sorteos activos alcanzado.\nEste servidor tiene ${activeGiveaways} sorteos activos de ${MAX_GIVEAWAYS} permitidos.\n\nEspera a que finalice uno para crear otro.`
        )],
        flags: MessageFlags.Ephemeral,
      });
    }

    const endTime = Date.now() + parsed.ms;
    const giveawayId = generateGiveawayId();

    const requirements = [];
    if (requiredRole) requirements.push(kv('Rol requerido', `<@&${requiredRole.id}>`));
    if (requiredLevel) {
      const levelLabel = levelType === 'global' ? 'Global' : 'Servidor';
      requirements.push(kv('Nivel mínimo', `\`${requiredLevel}\` (${levelLabel})`));
    }

    const lines = [
      header('🎉', 'Sorteo'),
      block([
        kv('Premio', `**${prize}**`),
        kv('Ganadores', `\`${winnerCount}\``),
        kv('Termina', `<t:${Math.floor(endTime / 1000)}:R>`),
        kv('Participantes', '`0`'),
      ]),
    ];

    if (requirements.length > 0) {
      lines.push('', header('📋', 'Requisitos'), block(requirements));
    }

    lines.push('', '-# Reacciona con 🎉 para participar');

    const embed = createEmbed({
      color: COLORS.GIVEAWAY,
      title: '🎉 Nuevo sorteo',
      description: lines.join('\n'),
      footer: {
        text: `ID: ${giveawayId} · Por ${interaction.user.tag}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    const msg = await interaction.channel.send({ embeds: [embed] });
    await msg.react('🎉');

    await Giveaway.create({
      giveawayId,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: msg.id,
      prize,
      winnerCount,
      endTime: new Date(endTime),
      hostedBy: interaction.user.tag,
      hostedById: interaction.user.id,
      requiredRoleId: requiredRole?.id || null,
      requiredLevel: requiredLevel || null,
      requiredLevelType: requiredLevel ? levelType : null,
      participants: [],
      winners: [],
      ended: false,
    });

    const remaining = MAX_GIVEAWAYS - (activeGiveaways + 1);
    const reqText = [];
    if (requiredRole) reqText.push(`rol ${requiredRole}`);
    if (requiredLevel) reqText.push(`nivel ${requiredLevel} (${levelType})`);

    const description = [
      header('✅', 'Sorteo creado'),
      block([
        kv('ID', `\`${giveawayId}\``),
        kv('Termina en', parsed.text),
        kv('Requisitos', reqText.length > 0 ? reqText.join(' y ') : '`Sin requisitos especiales`'),
        kv('Sorteos activos', `\`${activeGiveaways + 1} / ${MAX_GIVEAWAYS}\` (${remaining} disponibles)`),
      ]),
    ].join('\n');

    await interaction.reply({
      embeds: [successEmbed(description)],
      flags: MessageFlags.Ephemeral,
    });
  },
};