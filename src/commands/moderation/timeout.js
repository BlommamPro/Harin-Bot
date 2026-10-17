import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { header, block, kv } from '../../utils/embedDecorations.js';
import { parseTime, TIME_LIMITS } from '../../utils/parseTime.js';
import { addModLog } from '../../utils/modlog.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia temporalmente a un usuario')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('tiempo').setDescription('Duración: 1h30m, 7d, 5m, 30s, 2d12h...').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del timeout').setRequired(false).setMaxLength(512)
    ),

  PERMISSIONS: ['ModerateMembers'],
  BOT_PERMISSIONS: ['ModerateMembers'],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    const target = interaction.options.getMember('usuario');
    const timeInput = interaction.options.getString('tiempo');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('No encontré a ese usuario en el servidor.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes darte timeout a ti mismo.')], flags: MessageFlags.Ephemeral });
    }
    if (target.id === client.user.id) {
      return interaction.reply({ embeds: [errorEmbed('No puedes darme timeout a mí.')], flags: MessageFlags.Ephemeral });
    }
    if (target.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ embeds: [errorEmbed('No puedes dar timeout a alguien con un rol igual o superior al tuyo.')], flags: MessageFlags.Ephemeral });
    }
    if (!target.moderatable) {
      return interaction.reply({ embeds: [errorEmbed('No puedo moderar a ese usuario.')], flags: MessageFlags.Ephemeral });
    }

    const parsed = parseTime(timeInput);
    if (!parsed) {
      return interaction.reply({ embeds: [errorEmbed('Formato de tiempo inválido. Usa: `1h30m`, `7d`, `5m`, `30s`, `2d12h`...')], flags: MessageFlags.Ephemeral });
    }
    if (parsed.ms > TIME_LIMITS.timeout) {
      return interaction.reply({ embeds: [errorEmbed(`El timeout máximo es **28 días** (límite de Discord).`)], flags: MessageFlags.Ephemeral });
    }
    if (target.communicationDisabledUntilTimestamp && target.communicationDisabledUntilTimestamp > Date.now()) {
      return interaction.reply({ embeds: [errorEmbed('Ese usuario ya tiene un timeout activo.')], flags: MessageFlags.Ephemeral });
    }

    try {
      await target.timeout(parsed.ms, `${interaction.user.tag}: ${reason}`);
      await addModLog(interaction.guildId, target.id, interaction.user.id, 'timeout', reason, parsed.text);

      const description = [
        header('⏱️', 'Timeout aplicado'),
        block([
          kv('Usuario', `${target} (\`${target.id}\`)`),
          kv('Duración', parsed.text),
          kv('Expira', `<t:${Math.floor((Date.now() + parsed.ms) / 1000)}:R>`),
          kv('Razón', reason),
          kv('Moderador', interaction.user),
        ]),
      ].join('\n');

      const embed = successEmbed(description);
      embed.setFooter({ text: `Moderador: ${interaction.user.username}`, icon: interaction.user.displayAvatarURL() });
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ embeds: [errorEmbed(`No pude dar timeout: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  },
};