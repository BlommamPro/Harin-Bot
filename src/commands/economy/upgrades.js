import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed, COLORS } from '../../utils/embeds.js';
import { getGuildEconomy, updateGuildEconomy } from '../../utils/guildData.js';
import { UPGRADES, getUpgradeLevel, getUpgradeCost } from '../../utils/economyConfig.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('upgrades')
    .setDescription('📈 Compra mejoras para aumentar tus ganancias')
    .setDMPermission(false)
    .addSubcommand(sub =>
      sub.setName('view')
         .setDescription('📋 Ver todas las mejoras disponibles y tu progreso')
    )
    .addSubcommand(sub =>
      sub.setName('buy')
         .setDescription('🛒 Comprar o subir el nivel de una mejora')
         .addStringOption(opt =>
           opt.setName('mejora')
              .setDescription('ID de la mejora a comprar')
              .setRequired(true)
              .setAutocomplete(true)
         )
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  GUILD_ONLY: true,

  async autocomplete(client, interaction) {
    try {
      const focused = interaction.options.getFocused().toLowerCase();
      const economy = await getGuildEconomy(interaction.guildId, interaction.user.id);

      const choices = Object.entries(UPGRADES)
        .filter(([id, config]) => {
          const currentLevel = getUpgradeLevel(economy.upgrades, id);
          if (currentLevel >= config.maxLevel) return false;
          return config.name.toLowerCase().includes(focused) || id.includes(focused);
        })
        .slice(0, 25)
        .map(([id, config]) => {
          const currentLevel = getUpgradeLevel(economy.upgrades, id);
          const cost = getUpgradeCost(economy.upgrades, id);
          return {
            name: `${config.name} (Nv.${currentLevel}/${config.maxLevel}) — ${cost} coins`,
            value: id
          };
        });

      await interaction.respond(choices);
    } catch (err) {
      console.error('Error en autocomplete de upgrades:', err);
      try {
        await interaction.respond([]);
      } catch { /* ignorar */ }
    }
  },

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();
    const economy = await getGuildEconomy(interaction.guildId, interaction.user.id, interaction.user.username);

    if (sub === 'view') {
      const lines = Object.entries(UPGRADES).map(([id, config]) => {
        const currentLevel = getUpgradeLevel(economy.upgrades, id);
        const cost = getUpgradeCost(economy.upgrades, id);

        let status = '';
        if (currentLevel >= config.maxLevel) {
          status = '✅ **MÁXIMO**';
        } else if (currentLevel === 0) {
          status = `🔒 Sin comprar — 💰 **${cost}** coins`;
        } else {
          status = `Nv. **${currentLevel}/${config.maxLevel}** — Siguiente: 💰 **${cost}** coins`;
        }

        return `**${config.name}**\n> *${config.description}*\n> ${status}`;
      }).join('\n\n');

      const embed = createEmbed({
        color: COLORS.ECONOMY,
        title: '📈 Mejoras Disponibles',
        description: [
          `💰 **Tu balance:** ${economy.balance} coins`,
          '',
          lines,
          '',
          `💡 Usa \`/upgrades buy <mejora>\` para comprar.`
        ].join('\n'),
        footer: {
          text: `Solicitado por ${interaction.user.username}`,
          icon: interaction.user.displayAvatarURL()
        }
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'buy') {
      const upgradeId = interaction.options.getString('mejora');
      const config = UPGRADES[upgradeId];

      if (!config) {
        return interaction.reply({
          embeds: [errorEmbed('❌ Esa mejora no existe.')],
          flags: MessageFlags.Ephemeral
        });
      }

      const currentLevel = getUpgradeLevel(economy.upgrades, upgradeId);
      if (currentLevel >= config.maxLevel) {
        return interaction.reply({
          embeds: [errorEmbed(`❌ Ya tienes **${config.name}** al nivel máximo.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      const cost = getUpgradeCost(economy.upgrades, upgradeId);
      if ((economy.balance || 0) < cost) {
        return interaction.reply({
          embeds: [errorEmbed(
            `❌ No tienes suficientes coins.\n` +
            `💰 Necesitas: **${cost}** coins\n` +
            `💵 Tienes: **${economy.balance}** coins`
          )],
          flags: MessageFlags.Ephemeral
        });
      }

      const newLevel = currentLevel + 1;
      const upgrades = economy.upgrades || [];
      const existingIndex = upgrades.findIndex(u => u.upgradeId === upgradeId);

      if (existingIndex >= 0) {
        upgrades[existingIndex].level = newLevel;
      } else {
        upgrades.push({ upgradeId, level: newLevel });
      }

      await updateGuildEconomy(interaction.guildId, interaction.user.id, {
        $inc: { balance: -cost },
        $set: { upgrades }
      });

      const effectText = config.levels.find(l => l.level === newLevel)?.effect;
      let effectFormatted = '';
      if (upgradeId === 'better_bank') {
        effectFormatted = `Capacidad x${effectText}`;
      } else if (['better_job', 'crime_luck', 'rob_skill', 'bet_luck', 'pet', 'hourglass'].includes(upgradeId)) {
        effectFormatted = `+${(effectText * 100).toFixed(0)}%`;
      } else {
        effectFormatted = `+${effectText} coins`;
      }

      const embed = successEmbed(
        `✅ Compraste **${config.name}** — Nv. **${newLevel}/${config.maxLevel}**\n` +
        `📈 Efecto actual: **${effectFormatted}**\n` +
        `💰 Balance restante: **${economy.balance - cost}** coins`
      );
      embed.setTitle('🎉 ¡Mejora Comprada!');

      return interaction.reply({ embeds: [embed] });
    }
  }
};