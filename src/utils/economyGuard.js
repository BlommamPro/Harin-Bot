import { MessageFlags } from 'discord.js';
import { errorEmbed } from './embeds.js';
import { getEconomyConfig } from './economyConfigGuild.js';

export async function checkEconomyEnabled(guildId) {
  const config = await getEconomyConfig(guildId);
  if (!config.economyEnabled) {
    return {
      embeds: [errorEmbed('❌ La economía está desactivada en este servidor. Un administrador puede activarla con `/economyconfig toggle`.')],
      flags: MessageFlags.Ephemeral
    };
  }
  return null;
}