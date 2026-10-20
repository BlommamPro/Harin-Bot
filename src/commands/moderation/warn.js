import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv } from '../../utils/embedDecorations.js';
import { addWarn, getWarnCount, checkAutoAction, getWarnConfig } from '../../utils/warns.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón de la advertencia').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['ModerateMembers'],
  BOT_PERMISSIONS: ['ModerateMembers'],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getMember('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario en el servidor.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes advertirte a ti mismo.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes advertirme a mí.')], flags: MessageFlags.Ephemeral });
    }
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('No puedes advertir a alguien con un rol igual o superior al tuyo.')], flags: MessageFlags.Ephemeral });
    }
    if (!target.moderatable) {
      return interaction.reply({ embeds: [errorEmbed('No puedo moderar a ese usuario.')], flags: MessageFlags.Ephemeral });
    }

    const warnDoc = await addWarn(interaction.guildId, target.id, interaction.user.id, reason);
    const warnCount = await getWarnCount(interaction.guildId, target.id);
    await addModLog(interaction.guildId, target.id, interaction.user.id, 'warn', reason, null, warnDoc._id.toString());

    const autoAction = await checkAutoAction(interaction.guild, target, warnCount);
    const warnConfig = await getWarnConfig(interaction.guildId);

    if (warnConfig.dmUser) {
      try {
        const dmEmbed = createEmbed({
          color: COLORS.MODERATION,
          title: `⚠️ Advertencia en ${interaction.guild.name}`,
          description: block([
            kv('Razón', reason),
            kv('Moderador', interaction.user.tag),
            kv('Total de warns', `\`${warnCount}\``),
          ]),
          footer: {
            text: `ID del warn: ${warnDoc._id.toString().slice(-6)}`,
            icon: interaction.guild.iconURL(),
          },
        });
        await target.send({ embeds: [dmEmbed] });
      } catch { /* DM cerrado */ }
    }

    const lines = [
      block([
        kv('Usuario', `${target} (\`${target.id}\`)`),
        kv('Razón', reason),
        kv('Warns totales', `\`${warnCount}\``),
        kv('Moderador', interaction.user),
      ]),
    ];

    if (autoAction) {
      const actionText = {
        kick: 'expulsado',
        ban: 'baneado',
        timeout: `silenciado por ${autoAction.duration || 'un tiempo'} minutos`,
      };
      if (autoAction.success) {
        lines.push('', `-# 🤖 Acción automática: el usuario fue **${actionText[autoAction.action] || autoAction.action}**.`);
      } else {
        lines.push('', `-# ❌ Error en acción automática: ${autoAction.error}`);
      }
    }

    const embed = createEmbed({
      color: COLORS.SUCCESS,
      title: '⚠️ Usuario advertido',
      description: lines.join('\n'),
      footer: {
        text: `Moderador: ${interaction.user.username}`,
        icon: interaction.user.displayAvatarURL(),
      },
    });

    await interaction.reply({ embeds: [embed] });
  },
};