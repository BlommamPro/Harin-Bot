import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';
import {
  createRace, getRace, deleteRace,
  HORSES, simulateRace, renderTrack, getRaceComment,
  addBotPlayer,
  isGuildBusy, setGuildCooldown, clearGuildCooldown,
} from '../../utils/horseRaceHandler.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { applyBetLuck } from '../../utils/applyUpgrades.js';
import { logger } from '../../utils/logger.js';

const JOIN_TIME_HUMAN = 60000;
const JOIN_TIME_EMPTY = 30000;
const TICK_INTERVAL = 1200;

export default {
  CMD: new SlashCommandBuilder()
    .setName('horse-race')
    .setDescription('🐎 Crea una carrera de caballos interactiva')
    .setDMPermission(false)
    .addIntegerOption(opt =>
      opt.setName('apuesta_min')
         .setDescription('Apuesta mínima (por defecto 10)')
         .setRequired(false)
         .setMinValue(1).setMaxValue(100000)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 30,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.editReply({ embeds: economyDisabled.embeds });

    const busy = isGuildBusy(interaction.guildId);
    if (busy.busy) {
      if (busy.reason === 'active_race') {
        return interaction.editReply({
          embeds: [errorEmbed('Ya hay una carrera activa en este servidor. Espera a que termine.')],
        });
      }
      if (busy.reason === 'cooldown') {
        const seconds = Math.ceil(busy.timeLeftMs / 1000);
        return interaction.editReply({
          embeds: [errorEmbed(`Espera **${seconds}s** antes de crear otra carrera en este servidor.`)],
        });
      }
    }

    const config = await getEconomyConfig(interaction.guildId);
    const minBet = interaction.options.getInteger('apuesta_min') || config.minBet;
    const maxBet = config.maxBet;

    if (minBet > maxBet) {
      return interaction.editReply({
        embeds: [errorEmbed(`La apuesta mínima no puede superar la máxima (\`${formatNumber(maxBet)}\`).`)],
      });
    }

    const raceId = `hr${Date.now()}${interaction.user.id}`;
    createRace({
      raceId,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      hostId: interaction.user.id,
      minBet,
      maxBet,
    });

    setGuildCooldown(interaction.guildId, 60_000);

    const race = getRace(raceId);

    const buildLobbyEmbed = () => {
      const players = [...race.players.values()];
      const playersText = players.length === 0
        ? '> `Nadie todavía...`'
        : players.map(p => {
            const h = HORSES[p.horseIndex];
            return `> ${p.isBot ? '🤖' : '👤'} ${h.emoji} **${h.name}** · \`${formatNumber(p.bet)} coins\``;
          }).join('\n');

      return createEmbed({
        color: COLORS.ECONOMY,
        title: '🐎 Carrera de caballos',
        description: [
          block([
            kv('Apuesta mínima', `\`${formatNumber(minBet)} coins\``),
            kv('Apuesta máxima', `\`${formatNumber(maxBet)} coins\``),
            kv('Jugadores', `\`${players.length} / 10\``),
            kv('Tiempo', `\`${players.length === 0 ? 30 : 60}s\``),
          ]),
          '',
          '**🐎 Caballos**',
          HORSES.map((h, i) => `> **${i + 1}.** ${h.emoji} ${h.name}`).join('\n'),
          '',
          '**👥 Jugadores**',
          playersText,
          '',
          '-# Pulsa **Unirse** para participar. Si nadie se une en 30s, el bot competirá.',
        ].join('\n'),
        footer: { text: `Creada por ${interaction.user.username}` },
      });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`hr_join_${raceId}`)
        .setLabel('Unirse')
        .setEmoji('🐎')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`hr_start_${raceId}`)
        .setLabel('Empezar ya')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`hr_cancel_${raceId}`)
        .setLabel('Cancelar')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Danger),
    );

    const msg = await interaction.editReply({ embeds: [buildLobbyEmbed()], components: [row] });

    const emptyTimer = setTimeout(async () => {
      const r = getRace(raceId);
      if (!r || r.status !== 'lobby') return;
      const humanPlayers = [...r.players.values()].filter(p => !p.isBot).length;
      if (humanPlayers === 0) {
        addBotPlayer(raceId, 'Bot');
        await runRace(client, msg, raceId);
      }
    }, JOIN_TIME_EMPTY);

    const humanTimer = setTimeout(async () => {
      const r = getRace(raceId);
      if (!r || r.status !== 'lobby') return;
      const humanPlayers = [...r.players.values()].filter(p => !p.isBot).length;
      if (humanPlayers > 0) {
        await runRace(client, msg, raceId);
      }
    }, JOIN_TIME_HUMAN);

    race._timers = [emptyTimer, humanTimer];

    race._refresh = async () => {
      try {
        await msg.edit({ embeds: [buildLobbyEmbed()], components: [row] });
      } catch {}
    };
  },
};

export async function runRace(client, message, raceId) {
  const race = getRace(raceId);
  if (!race || race.status !== 'lobby') return;

  race.status = 'running';
  if (race._timers) race._timers.forEach(t => clearTimeout(t));

  if (race.players.size === 0) {
    deleteRace(raceId);
    clearGuildCooldown(race.guildId);
    return message.edit({
      embeds: [errorEmbed('Nadie se unió a la carrera. Cancelada.')],
      components: [],
    });
  }

  const { winnerIndex, timeline } = simulateRace();
  const winnerHorse = HORSES[winnerIndex];

  for (let i = 0; i < timeline.length; i++) {
    const track = renderTrack(timeline[i]);
    const comment = getRaceComment(timeline[i]);

    const animEmbed = createEmbed({
      color: COLORS.ECONOMY,
      title: `🏁 ¡Carrera en curso! · Tick ${i + 1}/${timeline.length}`,
      description: [
        `📣 ${comment}`,
        '',
        track,
      ].join('\n'),
      footer: { text: `Apuestas abiertas por ${race.players.size} jugador(es)` },
    });

    try {
      await message.edit({ embeds: [animEmbed], components: [] });
    } catch {}

    await new Promise(r => setTimeout(r, TICK_INTERVAL));
  }

  const winners = [];
  const losers = [];

  for (const [userId, player] of race.players) {
    if (player.horseIndex === winnerIndex) {
      const base = Math.floor(player.bet * winnerHorse.odds);

      if (player.isBot) {
        winners.push({ userId, player, payout: base, isBot: true });
      } else {
        const econ = await getGuildEconomy(race.guildId, userId);
        const finalPayout = applyBetLuck(base, econ.upgrades);

        await updateGuildEconomy(race.guildId, userId, {
          $inc: { balance: finalPayout },
        });
        await addWeeklyCoins(race.guildId, userId, '', finalPayout - player.bet);

        winners.push({ userId, player, payout: finalPayout, isBot: false });
      }
    } else {
      losers.push({ userId, player });
    }
  }

  const winnerLines = winners.length > 0
    ? winners.map((w, i) => {
        const tag = w.isBot ? '🤖 Bot' : `<@${w.userId}>`;
        const emoji = i === 0 ? '🥇' : '🏅';
        return `> ${emoji} ${tag} → \`+${formatNumber(w.payout)}\` coins`;
      }).join('\n')
    : '> `Nadie`';

  const loserLines = losers.length > 0
    ? losers.map(l => {
        const tag = l.player.isBot ? '🤖 Bot' : `<@${l.userId}>`;
        return `> 💸 ${tag} → \`-${formatNumber(l.player.bet)}\` coins`;
      }).join('\n')
    : '> `Nadie`';

  const description = [
    `🏆 **${winnerHorse.emoji} ${winnerHorse.name}** ganó la carrera`,
    '',
    '**Ganadores**',
    winnerLines,
    '',
    '**Perdedores**',
    loserLines,
  ].join('\n');

  const finalEmbed = createEmbed({
    color: COLORS.SUCCESS,
    title: '🏁 ¡Carrera terminada!',
    description,
    footer: { text: `Participantes: ${race.players.size}${race.vsBot ? ' · vs Bot' : ''}` },
  });

  try {
    await message.edit({ embeds: [finalEmbed], components: [] });
  } catch {}

  logger.event(`[HORSE-RACE] ${race.guildId} · Ganador: ${winnerHorse.name} · ${race.players.size} jugadores`);
  deleteRace(raceId);

  setTimeout(() => clearGuildCooldown(race.guildId), 10_000);
}