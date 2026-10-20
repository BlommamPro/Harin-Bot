import { MessageFlags } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds.js';
import { getRace } from '../../../utils/horseRaceHandler.js';
import { runRace } from '../../../commands/economy/horse-race.js';

export default {
  customId: 'hr_start_{}',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,

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
        embeds: [errorEmbed('La carrera ya comenzó.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (interaction.user.id !== race.hostId && race.players.size < 2) {
      return interaction.reply({
        embeds: [errorEmbed('Debes ser el host o haber al menos 2 jugadores para empezar.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (race.players.size < 1) {
      return interaction.reply({
        embeds: [errorEmbed('No hay jugadores unidos todavía.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate();
    await runRace(client, interaction.message, raceId);
  },
};