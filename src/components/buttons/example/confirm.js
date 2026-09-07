import { successEmbed } from '../../../utils/embeds.js';
import { MessageFlags } from 'discord.js';

/**
 * Este botón maneja customIds como:
 * - example-confirm (coincidencia exacta)
 * - example-confirm-{userId} (coincidencia por patrón)
 * 
 * Para usar con datos dinámicos, crea el botón así:
 * new ButtonBuilder().setCustomId(`example-confirm-{${interaction.user.id}}`)
 */

export default {
  customId: 'example-confirm',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,

  async execute(client, interaction, args, guildData, userData) {
    const userId = args[0];

    if (userId && userId !== interaction.user.id) {
      return interaction.reply({ 
        content: 'Este botón no es para ti.', flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({ 
      embeds: [successEmbed('¡Acción confirmada correctamente!')], flags: MessageFlags.Ephemeral });
  }
};