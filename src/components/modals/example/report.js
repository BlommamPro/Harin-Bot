import { MessageFlags } from 'discord.js';
import { successEmbed } from '../../../utils/embeds.js';

export default {
  customId: 'example-report',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 60,

  async execute(client, interaction, args, guildData, userData) {
    const reportedUserId = args[0];

    const reason = interaction.fields.getTextInputValue('reason');
    const details = interaction.fields.getTextInputValue('details');

    console.log(`Reporte: ${reportedUserId || 'General'} - ${reason} - ${details}`);

    return interaction.reply({
      embeds: [successEmbed('Reporte enviado correctamente. Gracias por tu colaboración.')],
      flags: MessageFlags.Ephemeral
    });
  }
};