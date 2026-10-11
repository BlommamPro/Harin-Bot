import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { getEconomyConfig, updateEconomyConfig } from '../../utils/economyConfigGuild.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('economyconfig')
    .setDescription('⚙️ Configura la economía de este servidor')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(sub =>
      sub.setName('view')
         .setDescription('📋 Ver la configuración actual')
    )

    .addSubcommand(sub =>
      sub.setName('cooldowns')
         .setDescription('⏱️ Ajustar cooldowns')
         .addIntegerOption(opt =>
           opt.setName('daily')
              .setDescription('Cooldown de /daily en minutos')
              .setMinValue(1)
              .setMaxValue(10080)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('work')
              .setDescription('Cooldown de /work en minutos')
              .setMinValue(1)
              .setMaxValue(1440)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('crime')
              .setDescription('Cooldown de /crime en minutos')
              .setMinValue(1)
              .setMaxValue(1440)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('rob')
              .setDescription('Cooldown de /rob en minutos')
              .setMinValue(1)
              .setMaxValue(1440)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('coinflip')
              .setDescription('Cooldown de /coinflip en segundos')
              .setMinValue(1)
              .setMaxValue(3600)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('slots')
              .setDescription('Cooldown de /slots en segundos')
              .setMinValue(1)
              .setMaxValue(3600)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('blackjack')
              .setDescription('Cooldown de /blackjack en segundos')
              .setMinValue(1)
              .setMaxValue(3600)
              .setRequired(false)
         )
    )

    .addSubcommand(sub =>
      sub.setName('rewards')
         .setDescription('💰 Ajustar recompensas')
         .addIntegerOption(opt =>
           opt.setName('daily')
              .setDescription('Recompensa base de /daily')
              .setMinValue(1)
              .setMaxValue(100000)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('streak_bonus')
              .setDescription('Bonus por día de racha en /daily')
              .setMinValue(0)
              .setMaxValue(10000)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('work_min')
              .setDescription('Recompensa mínima de /work')
              .setMinValue(1)
              .setMaxValue(10000)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('work_max')
              .setDescription('Recompensa máxima de /work')
              .setMinValue(1)
              .setMaxValue(100000)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('starting_balance')
              .setDescription('Balance inicial para nuevos usuarios')
              .setMinValue(0)
              .setMaxValue(1000000)
              .setRequired(false)
         )
    )

    .addSubcommand(sub =>
      sub.setName('bet_limits')
         .setDescription('🎲 Ajustar apuestas mínimas y máximas')
         .addIntegerOption(opt =>
           opt.setName('min')
              .setDescription('Apuesta mínima')
              .setMinValue(1)
              .setMaxValue(100000)
              .setRequired(false)
         )
         .addIntegerOption(opt =>
           opt.setName('max')
              .setDescription('Apuesta máxima')
              .setMinValue(100)
              .setMaxValue(10000000)
              .setRequired(false)
         )
    )

    .addSubcommand(sub =>
      sub.setName('toggle')
         .setDescription('🔧 Activar o desactivar toda la economía del servidor')
         .addBooleanOption(opt =>
           opt.setName('activar')
              .setDescription('true = activado, false = desactivado')
              .setRequired(true)
         )
    )

    .addSubcommand(sub =>
      sub.setName('reset')
         .setDescription('🔄 Reiniciar la configuración a valores por defecto')
         .addBooleanOption(opt =>
           opt.setName('confirmar')
              .setDescription('Escribe true para confirmar')
              .setRequired(true)
         )
    ),

  PERMISSIONS: ['Administrator'],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'view') {
      const config = await getEconomyConfig(guildId);

      const embed = createEmbed({
        color: COLORS.ECONOMY,
        title: `⚙️ Configuración de Economía — ${interaction.guild.name}`,
        description: [
          `**⏱️ Cooldowns**`,
          `• /daily: \`${config.dailyCooldownMinutes} min\``,
          `• /work: \`${config.workCooldownMinutes} min\``,
          `• /crime: \`${config.crimeCooldownMinutes} min\``,
          `• /rob: \`${config.robCooldownMinutes} min\``,
          `• /coinflip: \`${config.coinflipCooldownSeconds}s\``,
          `• /slots: \`${config.slotsCooldownSeconds}s\``,
          `• /blackjack: \`${config.blackjackCooldownSeconds}s\``,
          `• /pay: \`${config.payCooldownMinutes} min\``,
          '',
          `**💰 Recompensas**`,
          `• /daily base: \`${config.dailyReward}\``,
          `• Streak bonus: \`${config.dailyStreakBonus}\``,
          `• /work rango: \`${config.workMinReward} - ${config.workMaxReward}\``,
          `• Balance inicial: \`${config.startingBalance}\``,
          '',
          `**🎲 Apuestas**`,
          `• Mínima: \`${config.minBet}\``,
          `• Máxima: \`${config.maxBet}\``,
          '',
          `**🔧 Estado:** ${config.economyEnabled ? '✅ Activada' : '❌ Desactivada'}`
        ].join('\n'),
        footer: {
          text: `Usa /economyconfig para ajustar`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'cooldowns') {
      const update = {};
      const daily = interaction.options.getInteger('daily');
      const work = interaction.options.getInteger('work');
      const crime = interaction.options.getInteger('crime');
      const rob = interaction.options.getInteger('rob');
      const coinflip = interaction.options.getInteger('coinflip');
      const slots = interaction.options.getInteger('slots');
      const blackjack = interaction.options.getInteger('blackjack');

      if (daily !== null) update.dailyCooldownMinutes = daily;
      if (work !== null) update.workCooldownMinutes = work;
      if (crime !== null) update.crimeCooldownMinutes = crime;
      if (rob !== null) update.robCooldownMinutes = rob;
      if (coinflip !== null) update.coinflipCooldownSeconds = coinflip;
      if (slots !== null) update.slotsCooldownSeconds = slots;
      if (blackjack !== null) update.blackjackCooldownSeconds = blackjack;

      if (Object.keys(update).length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes especificar al menos un cooldown.')],
          flags: MessageFlags.Ephemeral
        });
      }

      await updateEconomyConfig(guildId, update);

      return interaction.reply({
        embeds: [successEmbed(
          `✅ Cooldowns actualizados:\n` +
          Object.entries(update).map(([k, v]) => `• ${k}: \`${v}\``).join('\n')
        )]
      });
    }

    if (sub === 'rewards') {
      const update = {};
      const daily = interaction.options.getInteger('daily');
      const streakBonus = interaction.options.getInteger('streak_bonus');
      const workMin = interaction.options.getInteger('work_min');
      const workMax = interaction.options.getInteger('work_max');
      const startingBalance = interaction.options.getInteger('starting_balance');

      if (daily !== null) update.dailyReward = daily;
      if (streakBonus !== null) update.dailyStreakBonus = streakBonus;
      if (workMin !== null) update.workMinReward = workMin;
      if (workMax !== null) update.workMaxReward = workMax;
      if (startingBalance !== null) update.startingBalance = startingBalance;

      if (Object.keys(update).length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes especificar al menos una recompensa.')],
          flags: MessageFlags.Ephemeral
        });
      }

      if (update.workMinReward && update.workMaxReward && update.workMinReward > update.workMaxReward) {
        return interaction.reply({
          embeds: [errorEmbed('❌ La recompensa mínima no puede ser mayor que la máxima.')],
          flags: MessageFlags.Ephemeral
        });
      }

      await updateEconomyConfig(guildId, update);

      return interaction.reply({
        embeds: [successEmbed(
          `✅ Recompensas actualizadas:\n` +
          Object.entries(update).map(([k, v]) => `• ${k}: \`${v}\``).join('\n')
        )]
      });
    }

    if (sub === 'bet_limits') {
      const min = interaction.options.getInteger('min');
      const max = interaction.options.getInteger('max');

      const update = {};
      if (min !== null) update.minBet = min;
      if (max !== null) update.maxBet = max;

      if (Object.keys(update).length === 0) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes especificar al menos un límite.')],
          flags: MessageFlags.Ephemeral
        });
      }

      const config = await getEconomyConfig(guildId);
      const finalMin = update.minBet ?? config.minBet;
      const finalMax = update.maxBet ?? config.maxBet;

      if (finalMin > finalMax) {
        return interaction.reply({
          embeds: [errorEmbed('❌ La apuesta mínima no puede ser mayor que la máxima.')],
          flags: MessageFlags.Ephemeral
        });
      }

      await updateEconomyConfig(guildId, update);

      return interaction.reply({
        embeds: [successEmbed(
          `✅ Límites de apuesta actualizados:\n` +
          `• Mínima: \`${finalMin}\`\n` +
          `• Máxima: \`${finalMax}\``
        )]
      });
    }

    if (sub === 'toggle') {
      const enable = interaction.options.getBoolean('activar');
      await updateEconomyConfig(guildId, { economyEnabled: enable });

      return interaction.reply({
        embeds: [successEmbed(
          `🔧 Economía ${enable ? '✅ **activada**' : '❌ **desactivada**'} en este servidor.`
        )]
      });
    }

    if (sub === 'reset') {
      const confirm = interaction.options.getBoolean('confirmar');
      if (!confirm) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Debes confirmar con `confirmar:true`.')],
          flags: MessageFlags.Ephemeral
        });
      }

      await updateEconomyConfig(guildId, {
        dailyCooldownMinutes: 24 * 60,
        workCooldownMinutes: 30,
        crimeCooldownMinutes: 60,
        robCooldownMinutes: 120,
        coinflipCooldownSeconds: 10,
        slotsCooldownSeconds: 15,
        blackjackCooldownSeconds: 10,
        payCooldownMinutes: 1,
        dailyReward: 100,
        dailyStreakBonus: 50,
        workMinReward: 25,
        workMaxReward: 150,
        startingBalance: 500,
        economyEnabled: true,
        minBet: 10,
        maxBet: 100000
      });

      return interaction.reply({
        embeds: [successEmbed('🔄 Configuración de economía reiniciada a valores por defecto.')]
      });
    }
  }
};