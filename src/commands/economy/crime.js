import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyCrimeLuck, applyPetBonus } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

const CRIMES = [
  { name: 'robo a un banco', description: 'planeaste y ejecutaste un atraco perfecto', min: 80, max: 350, failPenalty: 150, emoji: '🏦' },
  { name: 'hackeo a una cuenta premium', description: 'descifraste contraseñas de alto nivel', min: 60, max: 280, failPenalty: 100, emoji: '💻' },
  { name: 'estafa en el mercado negro', description: 'vendiste productos falsificados', min: 50, max: 220, failPenalty: 80, emoji: '🕵️' },
  { name: 'extorsión a un comerciante', description: 'intimidaste a un empresario local', min: 100, max: 300, failPenalty: 180, emoji: '😈' },
  { name: 'tráfico de memes raros', description: 'vendiste memes de edición limitada', min: 40, max: 180, failPenalty: 60, emoji: '🤣' },
  { name: 'robo de autos de lujo', description: 'te llevaste un deportivo', min: 120, max: 350, failPenalty: 200, emoji: '🚗' },
  { name: 'falsificación de obras de arte', description: 'vendiste cuadros falsos', min: 90, max: 280, failPenalty: 140, emoji: '🎨' },
  { name: 'secuestro de datos', description: 'robaste información confidencial', min: 70, max: 250, failPenalty: 120, emoji: '🔒' },
  { name: 'contrabando de relojes', description: 'pasaste relojes suizos por aduanas', min: 100, max: 320, failPenalty: 160, emoji: '⌚' },
  { name: 'clonación de tarjetas', description: 'copiaste tarjetas de crédito', min: 60, max: 200, failPenalty: 110, emoji: '💳' },
  { name: 'robo de criptomonedas', description: 'hackeaste una cartera digital', min: 80, max: 300, failPenalty: 150, emoji: '₿' },
  { name: 'estafa piramidal', description: 'convenciste a inversores', min: 110, max: 340, failPenalty: 190, emoji: '🏛️' },
  { name: 'robo en una joyería', description: 'te llevaste diamantes y oro', min: 130, max: 360, failPenalty: 220, emoji: '💎' },
  { name: 'tráfico de información', description: 'vendiste secretos corporativos', min: 70, max: 260, failPenalty: 130, emoji: '📊' },
  { name: 'asalto a un casino', description: 'robaste en un casino de lujo', min: 150, max: 400, failPenalty: 250, emoji: '🎰' },
];

const FAIL_MESSAGES = [
  'la policía te tendió una emboscada y pagaste una fianza',
  'un testigo te delató y tuviste que sobornar al juez',
  'la seguridad privada te atrapó y pagaste una multa',
  'tu cómplice te traicionó y perdiste dinero',
  'las cámaras de seguridad te grabaron y tuviste que pagar abogados',
  'un vecino llamó a la policía y te escapaste pero perdiste el botín',
];

export default {
  CMD: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Comete un crimen para ganar (o perder) dinero')
    .setDMPermission(false),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction) {
    await interaction.deferReply();

    const economyDisabled = await checkEconomyEnabled(interaction.guildId);
    if (economyDisabled) return interaction.editReply({ embeds: economyDisabled.embeds });

    const config = await getEconomyConfig(interaction.guildId);
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    const cd = await checkDbCooldown(interaction.user.id, `crime_${interaction.guildId}`, config.crimeCooldownMinutes);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`La policía te está vigilando. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const crime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    const successChance = applyCrimeLuck(0.55, economy.upgrades);
    const success = Math.random() < successChance;

    if (success) {
      const baseReward = Math.floor(Math.random() * (crime.max - crime.min + 1)) + crime.min;
      const reward = applyPetBonus(baseReward, economy.upgrades);

      await updateGuildEconomy(interaction.guildId, interaction.user.id, {
        $inc: { balance: reward, crimes: 1 },
      });
      await setDbCooldown(interaction.user.id, `crime_${interaction.guildId}`);
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, reward);

      const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
      const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

      const description = [
        `-# ${crime.description}`,
        '',
        block([
          kv('Ganancia', `\`${formatNumber(reward)} coins\``),
          kv('Crímenes', `\`${updatedEconomy.crimes}\``),
          kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
        ]),
      ].join('\n');

      const embed = createEmbed({
        color: COLORS.SUCCESS,
        title: `${crime.emoji} Crimen exitoso: ${crime.name}`,
        description,
      });

      if (newAchievements.length > 0) {
        embed.addFields({
          name: '🏆 Logros desbloqueados',
          value: newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n'),
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    const fine = Math.min(Math.floor((economy.balance || 0) * 0.1), crime.failPenalty);
    const failMessage = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];

    await updateGuildEconomy(interaction.guildId, interaction.user.id, { $inc: { balance: -fine } });
    await setDbCooldown(interaction.user.id, `crime_${interaction.guildId}`);

    const description = [
      `-# ${crime.name}`,
      '',
      block([
        kv('Motivo', failMessage),
        kv('Multa', `\`${formatNumber(fine)} coins\``),
      ]),
    ].join('\n');

    const embed = createEmbed({
      color: COLORS.ERROR,
      title: `${crime.emoji} Te atraparon`,
      description,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};