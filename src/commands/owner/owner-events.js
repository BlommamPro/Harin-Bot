import {
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, header, formatNumber } from '../../utils/embedDecorations.js';
import { parseTime } from '../../utils/parseTime.js';
import {
  createEvent,
  cancelEvent,
  cancelAllByType,
  listUpcomingAndActive,
  cleanupExpiredEvents,
  formatEventType,
  formatMultiplier,
} from '../../utils/eventManager.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('owner-events')
    .setDescription('👑 Gestiona eventos globales (solo owner)')
    .setDMPermission(true)

    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Inicia un evento global')
        .addStringOption(opt =>
          opt.setName('tipo')
            .setDescription('Tipo de evento')
            .setRequired(true)
            .addChoices(
              { name: '⭐ XP (niveles)', value: 'xp' },
              { name: '💰 Coins (economía)', value: 'coins' }
            )
        )
        .addNumberOption(opt =>
          opt.setName('multiplicador')
            .setDescription('Multiplicador (ej: 2 = x2, 1.5 = +50%)')
            .setRequired(true)
            .setMinValue(1.01)
            .setMaxValue(100)
        )
        .addStringOption(opt =>
          opt.setName('duracion')
            .setDescription('Duración: 2h, 30m, 1d, 7d...')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('nombre')
            .setDescription('Nombre visible del evento (opcional)')
            .setRequired(false)
            .setMaxLength(80)
        )
    )

    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('Termina un evento por ID')
        .addStringOption(opt =>
          opt.setName('id').setDescription('ID del evento').setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName('end_type')
        .setDescription('Termina todos los eventos activos de un tipo')
        .addStringOption(opt =>
          opt.setName('tipo')
            .setDescription('Tipo a cancelar')
            .setRequired(true)
            .addChoices(
              { name: '⭐ XP', value: 'xp' },
              { name: '💰 Coins', value: 'coins' }
            )
        )
    )

    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista los eventos activos')
    ),

  OWNER: true,
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  COOLDOWN: 3,
  GUILD_ONLY: false,

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const type = interaction.options.getString('tipo');
      const multiplier = interaction.options.getNumber('multiplicador');
      const durationStr = interaction.options.getString('duracion');
      const name = interaction.options.getString('nombre') || null;

      const parsed = parseTime(durationStr);
      if (!parsed) {
        return interaction.reply({
          embeds: [errorEmbed('Formato de duración inválido. Usa: `2h`, `30m`, `1d`, `7d12h`...')],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (parsed.ms > 30 * 24 * 60 * 60 * 1000) {
        return interaction.reply({
          embeds: [errorEmbed('La duración máxima de un evento es **30 días**.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const result = await createEvent({
        type,
        multiplier,
        durationMs: parsed.ms,
        name,
        createdBy: interaction.user.id,
      });

      if (!result.ok) {
        return interaction.reply({
          embeds: [errorEmbed(`No pude crear el evento: \`${result.reason}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const ev = result.event;
      const description = block([
        kv('ID', `\`${ev._id}\``),
        kv('Nombre', ev.name || '`Sin nombre`'),
        kv('Tipo', formatEventType(ev.type)),
        kv('Multiplicador', `\`${formatMultiplier(ev.multiplier)}\``),
        kv('Duración', `\`${parsed.text}\``),
        kv('Termina', `<t:${Math.floor(ev.endTime.getTime() / 1000)}:R>`),
      ]);

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.SUCCESS,
          title: '🎉 Evento global iniciado',
          description,
          footer: {
            text: 'Nota: se cerraron automáticamente los eventos del mismo tipo que estuvieran activos.',
            icon: interaction.user.displayAvatarURL(),
          },
        })],
      });
    }

    if (sub === 'end') {
      const id = interaction.options.getString('id').trim();

      if (!/^[a-f0-9]{24}$/i.test(id)) {
        return interaction.reply({
          embeds: [errorEmbed('ID inválido. Debe ser un ObjectId de MongoDB.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const ev = await cancelEvent(id);
      if (!ev) {
        return interaction.reply({
          embeds: [errorEmbed('No encontré un evento con ese ID.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.WARNING,
          title: '🛑 Evento terminado',
          description: block([
            kv('ID', `\`${ev._id}\``),
            kv('Nombre', ev.name || '`Sin nombre`'),
            kv('Tipo', formatEventType(ev.type)),
            kv('Multiplicador', `\`${formatMultiplier(ev.multiplier)}\``),
          ]),
        })],
      });
    }

    if (sub === 'end_type') {
      const type = interaction.options.getString('tipo');
      const count = await cancelAllByType(type);

      return interaction.reply({
        embeds: [createEmbed({
          color: count > 0 ? COLORS.WARNING : COLORS.INFO,
          title: '🛑 Eventos terminados',
          description: block([
            kv('Tipo', formatEventType(type)),
            kv('Eventos cancelados', `\`${count}\``),
          ]),
        })],
      });
    }

    if (sub === 'list') {
      await cleanupExpiredEvents().catch(() => {});
      const events = await listUpcomingAndActive();

      if (events.length === 0) {
        return interaction.reply({
          embeds: [createEmbed({
            color: COLORS.INFO,
            title: '📅 Eventos activos',
            description: 'No hay eventos activos actualmente.',
          })],
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = events.map(e => {
        return [
          `**${e.name || 'Sin nombre'}** · ${formatEventType(e.type)}`,
          `> ${formatMultiplier(e.multiplier)} · Termina <t:${Math.floor(new Date(e.endTime).getTime() / 1000)}:R>`,
          `> ID: \`${e._id}\``,
        ].join('\n');
      });

      return interaction.reply({
        embeds: [createEmbed({
          color: COLORS.INFO,
          title: `📅 Eventos activos (${events.length})`,
          description: lines.join('\n\n'),
          footer: {
            text: `Solicitado por ${interaction.user.username}`,
            icon: interaction.user.displayAvatarURL(),
          },
        })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};