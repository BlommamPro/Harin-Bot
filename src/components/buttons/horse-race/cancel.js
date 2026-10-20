import { MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getRace, deleteRace, clearGuildCooldown } from '../../../utils/horseRaceHandler.js';
import { updateGuildEconomy } from '../../../utils/guildData.js';

export default {
  customId: 'hr_cancel_{}',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 2,

  async execute(client, interaction, args) {
    const raceId = args[0];
    const race = getRace(raceId);

    if (!race) {
      return interaction.reply({
        embeds: [errorEmbed('Esa carrera ya no existe.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (race.status !== 'lobby') {
      return interaction.reply({
        embeds: [errorEmbed('La carrera ya comenzó, no puedes cancelarla.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (interaction.user.id !== race.hostId) {
      return interaction.reply({
        embeds: [errorEmbed('Solo el creador de la carrera puede cancelarla.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    let refunded = 0;
    for (const [userId, player] of race.players) {
      if (player.isBot) continue;
      await updateGuildEconomy(race.guildId, userId, {
        $inc: { balance: player.bet },
      });
      refunded++;
    }

    if (race._timers) race._timers.forEach(t => clearTimeout(t));
    deleteRace(raceId);

    clearGuildCooldown(race.guildId);

    await interaction.update({
      embeds: [successEmbed(`Carrera cancelada. Se devolvieron las apuestas a ${refunded} jugador(es).`)],
      components: [],
    });
  },
};