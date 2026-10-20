import { MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { getRace, addPlayer, HORSES } from '../../../utils/horseRaceHandler.js';
import { getGuildEconomy, updateGuildEconomy } from '../../../utils/guildData.js';

export default {
  customId: 'hr_bet_{}_{}',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 2,

  async execute(client, interaction, args) {
    const [raceId, userId] = args;

    console.log('[hr_bet] args:', args);
    console.log('[hr_bet] raceId:', raceId, 'userId:', userId, 'interaction.user.id:', interaction.user.id);

    if (userId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed('Este modal no es para ti.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const race = getRace(raceId);
    if (!race) {
      return interaction.reply({
        embeds: [errorEmbed('La carrera ya no existe.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (race.status !== 'lobby') {
      return interaction.reply({
        embeds: [errorEmbed('La carrera ya comenzó.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const horseRaw = interaction.fields.getTextInputValue('horse').trim();
    const betRaw = interaction.fields.getTextInputValue('bet').trim();

    const horseNum = parseInt(horseRaw, 10);
    const bet = parseInt(betRaw, 10);

    if (isNaN(horseNum) || horseNum < 1 || horseNum > HORSES.length) {
      return interaction.reply({
        embeds: [errorEmbed(`Caballo inválido. Elige un número del 1 al ${HORSES.length}.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (isNaN(bet) || bet < race.minBet || bet > race.maxBet) {
      return interaction.reply({
        embeds: [errorEmbed(`Apuesta inválida. Debe estar entre \`${race.minBet}\` y \`${race.maxBet}\` coins.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const economy = await getGuildEconomy(race.guildId, interaction.user.id, interaction.user.username);
    if ((economy.balance || 0) < bet) {
      return interaction.reply({
        embeds: [errorEmbed(`No tienes suficientes coins. Tienes \`${economy.balance}\` y quieres apostar \`${bet}\`.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const horseIndex = horseNum - 1;
    const result = addPlayer(raceId, interaction.user.id, horseIndex, bet);

    if (!result.ok) {
      return interaction.reply({
        embeds: [errorEmbed(
          result.reason === 'already_joined'
            ? 'Ya estás participando en esta carrera.'
            : 'La carrera ya no acepta jugadores.'
        )],
        flags: MessageFlags.Ephemeral,
      });
    }

    await updateGuildEconomy(race.guildId, interaction.user.id, {
      $inc: { balance: -bet },
    });

    if (race._refresh) {
      await race._refresh();
    }

    const horse = HORSES[horseIndex];

    return interaction.reply({
      embeds: [successEmbed(
        `¡Estás dentro de la carrera!\n\n**Caballo:** ${horse.emoji} ${horse.name}\n**Apuesta:** \`${bet} coins\``
      )],
      flags: MessageFlags.Ephemeral,
    });
  },
};