import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { block, kv, formatNumber } from '../../utils/embedDecorations.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAchievements } from '../../utils/achievements.js';
import { applyPetBonus } from '../../utils/applyUpgrades.js';
import { addWeeklyCoins } from '../../utils/weeklyRanking.js';
import { getEconomyConfig } from '../../utils/economyConfigGuild.js';
import { checkEconomyEnabled } from '../../utils/economyGuard.js';

const MINERALS = [
  { name: 'Carbón', emoji: '⚫', min: 15, max: 40, chance: 0.30, rarity: 'Común' },
  { name: 'Hierro', emoji: '⚙️', min: 30, max: 70, chance: 0.25, rarity: 'Común' },
  { name: 'Cobre', emoji: '🟠', min: 45, max: 100, chance: 0.15, rarity: 'Poco común' },
  { name: 'Plata', emoji: '⚪', min: 70, max: 150, chance: 0.10, rarity: 'Poco común' },
  { name: 'Oro', emoji: '🟡', min: 120, max: 250, chance: 0.08, rarity: 'Raro' },
  { name: 'Esmeralda', emoji: '🟢', min: 180, max: 350, chance: 0.05, rarity: 'Raro' },
  { name: 'Rubí', emoji: '🔴', min: 250, max: 500, chance: 0.03, rarity: 'Épico' },
  { name: 'Diamante', emoji: '💎', min: 400, max: 800, chance: 0.015, rarity: 'Épico' },
  { name: 'Zafiro', emoji: '🔵', min: 500, max: 1000, chance: 0.008, rarity: 'Legendario' },
  { name: 'Esquirla de Estrella', emoji: '✨', min: 800, max: 1500, chance: 0.002, rarity: 'Mítico' },
];

const JUNK = [
  { name: 'Piedra', emoji: '🪨', min: 0, max: 5, rarity: 'Basura' },
  { name: 'Tierra', emoji: '🟤', min: 0, max: 3, rarity: 'Basura' },
];

const RARITY_COLORS = {
  Basura: 0x808080,
  Común: 0x95A5A6,
  'Poco común': 0x3498DB,
  Raro: 0x9B59B6,
  Épico: 0xE67E22,
  Legendario: 0xF1C40F,
  Mítico: 0xE91E63,
};

function pickMineral() {
  if (Math.random() < 0.15) {
    return JUNK[Math.floor(Math.random() * JUNK.length)];
  }
  const roll = Math.random();
  let acc = 0;
  for (const m of MINERALS) {
    acc += m.chance;
    if (roll <= acc) return m;
  }
  return MINERALS[0];
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('mine')
    .setDescription('⛏️ Mina para encontrar minerales y ganar coins')
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

    const cooldownMin = config.mineCooldownMinutes ?? 8;
    const cd = await checkDbCooldown(interaction.user.id, `mine_${interaction.guildId}`, cooldownMin);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Estás recuperando fuerzas. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const found = pickMineral();
    const baseReward = found.min === found.max
      ? found.min
      : Math.floor(Math.random() * (found.max - found.min + 1)) + found.min;
    const reward = baseReward > 0 ? applyPetBonus(baseReward, economy.upgrades) : 0;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: reward },
    });
    await setDbCooldown(interaction.user.id, `mine_${interaction.guildId}`);
    if (reward > 0) {
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, reward);
    }

    const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
    const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

    const description = block([
      kv('Encontrado', `${found.emoji} **${found.name}**`),
      kv('Rareza', `\`${found.rarity}\``),
      kv('Ganancia', reward > 0 ? `\`${formatNumber(reward)} coins\`` : '`Nada`'),
      kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
    ]);

    const embed = createEmbed({
      color: RARITY_COLORS[found.rarity] || COLORS.ECONOMY,
      title: reward > 0 ? '⛏️ ¡Buena veta!' : '⛏️ Sin suerte',
      description,
      footer: { text: `Siguiente minería disponible en ${cooldownMin} min` },
    });

    if (newAchievements.length > 0) {
      embed.addFields({
        name: '🏆 Logros desbloqueados',
        value: newAchievements.map(a => `${a.emoji} **${a.name}**`).join('\n'),
      });
    }

    return interaction.editReply({ embeds: [embed] });
  },
};