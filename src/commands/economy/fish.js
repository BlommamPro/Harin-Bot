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

const FISH = [
  { name: 'Sardina', emoji: '🐟', min: 10, max: 30, chance: 0.30, rarity: 'Común' },
  { name: 'Trucha', emoji: '🐠', min: 25, max: 60, chance: 0.25, rarity: 'Común' },
  { name: 'Salmón', emoji: '🍣', min: 40, max: 90, chance: 0.18, rarity: 'Poco común' },
  { name: 'Atún', emoji: '🐡', min: 60, max: 130, chance: 0.12, rarity: 'Poco común' },
  { name: 'Pez espada', emoji: '🗡️', min: 100, max: 200, chance: 0.07, rarity: 'Raro' },
  { name: 'Pez globo', emoji: '🐡', min: 80, max: 160, chance: 0.04, rarity: 'Raro' },
  { name: 'Tiburón', emoji: '🦈', min: 180, max: 350, chance: 0.02, rarity: 'Épico' },
  { name: 'Pulpo gigante', emoji: '🐙', min: 250, max: 500, chance: 0.012, rarity: 'Épico' },
  { name: 'Pez dorado', emoji: '✨', min: 400, max: 800, chance: 0.006, rarity: 'Legendario' },
  { name: 'Ballena', emoji: '🐋', min: 600, max: 1200, chance: 0.002, rarity: 'Mítico' },
];

const TRASH = [
  { name: 'Bota vieja', emoji: '🥾', min: 0, max: 5, rarity: 'Basura' },
  { name: 'Lata oxidada', emoji: '🥫', min: 0, max: 3, rarity: 'Basura' },
  { name: 'Alga', emoji: '🌿', min: 0, max: 2, rarity: 'Basura' },
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

function pickFish() {
  if (Math.random() < 0.15) {
    return TRASH[Math.floor(Math.random() * TRASH.length)];
  }
  const roll = Math.random();
  let acc = 0;
  for (const fish of FISH) {
    acc += fish.chance;
    if (roll <= acc) return fish;
  }
  return FISH[0];
}

export default {
  CMD: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('🐟 Pesca para ganar coins')
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

    const cooldownMin = config.fishCooldownMinutes ?? 5;
    const cd = await checkDbCooldown(interaction.user.id, `fish_${interaction.guildId}`, cooldownMin);
    if (cd.onCooldown) {
      return interaction.editReply({
        embeds: [errorEmbed(`Estás descansando de pescar. Vuelve <t:${cd.nextTimestamp}:R>.`)],
      });
    }

    const caught = pickFish();
    const baseReward = caught.min === caught.max
      ? caught.min
      : Math.floor(Math.random() * (caught.max - caught.min + 1)) + caught.min;
    const reward = baseReward > 0 ? applyPetBonus(baseReward, economy.upgrades) : 0;

    await updateGuildEconomy(interaction.guildId, interaction.user.id, {
      $inc: { balance: reward },
    });
    await setDbCooldown(interaction.user.id, `fish_${interaction.guildId}`);
    if (reward > 0) {
      await addWeeklyCoins(interaction.guildId, interaction.user.id, interaction.user.username, reward);
    }

    const updatedEconomy = await getGuildEconomy(interaction.guildId, interaction.user.id);
    const newAchievements = await checkAchievements(interaction.guildId, interaction.user.id, updatedEconomy);

    const description = block([
      kv('Captura', `${caught.emoji} **${caught.name}**`),
      kv('Rareza', `\`${caught.rarity}\``),
      kv('Ganancia', reward > 0 ? `\`${formatNumber(reward)} coins\`` : '`Nada`'),
      kv('Balance actual', `\`${formatNumber(updatedEconomy.balance)} coins\``),
    ]);

    const embed = createEmbed({
      color: RARITY_COLORS[caught.rarity] || COLORS.ECONOMY,
      title: reward > 0 ? '🎣 ¡Buena pesca!' : '🎣 Mala suerte',
      description,
      footer: { text: `Siguiente pesca disponible en ${cooldownMin} min` },
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