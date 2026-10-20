import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js';
import { errorEmbed } from '../../../utils/embeds.js';
import { getRace, HORSES } from '../../../utils/horseRaceHandler.js';

export default {
  customId: 'hr_join_{}',

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
        embeds: [errorEmbed('La carrera ya comenzó.')],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (race.players.has(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed('Ya estás participando en esta carrera.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const horseLabel = `Caballo (1-${HORSES.length})`;
    const horsePlaceholder = HORSES.map((h, i) => `${i + 1}.${h.name}`).join(' ');

    const modal = new ModalBuilder()
      .setCustomId(`hr_bet_${raceId}_${interaction.user.id}`)
      .setTitle('🐎 Apuesta de carrera');

    const horseInput = new TextInputBuilder()
      .setCustomId('horse')
      .setLabel(horseLabel)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(horsePlaceholder)
      .setMinLength(1)
      .setMaxLength(1)
      .setRequired(true);

    const betInput = new TextInputBuilder()
      .setCustomId('bet')
      .setLabel(`Apuesta (${race.minBet} - ${race.maxBet})`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Cantidad de coins')
      .setMinLength(1)
      .setMaxLength(7)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(horseInput),
      new ActionRowBuilder().addComponents(betInput),
    );

    try {
      await interaction.showModal(modal);
    } catch (err) {
      console.error('[hr_join] Error al mostrar modal:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [errorEmbed('No pude abrir el formulario. Intenta de nuevo.')],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  },
};