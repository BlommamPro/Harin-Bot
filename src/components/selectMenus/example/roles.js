import { successEmbed, errorEmbed } from '../../../utils/embeds.js';
import { MessageFlags } from 'discord.js';

export default {
  customId: 'example-roles',

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 10,

  async execute(client, interaction, args, guildData, userData) {
    const selectedRole = interaction.values[0];
    
    const role = interaction.guild.roles.cache.get(selectedRole);
    if (!role) {
      return interaction.reply({ embeds: [errorEmbed('Ese rol no existe')], flags: MessageFlags.Ephemeral });
    }

    if (!role.editable) {
      return interaction.reply({ 
        embeds: [errorEmbed('No tengo permisos para darte ese rol')], flags: MessageFlags.Ephemeral });
    }

    if (interaction.member.roles.cache.has(selectedRole)) {
      await interaction.member.roles.remove(selectedRole);
      await interaction.reply({ 
        embeds: [successEmbed(`Rol <@&${selectedRole}> removido`)], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.member.roles.add(selectedRole);
      await interaction.reply({ 
        embeds: [successEmbed(`Rol <@&${selectedRole}> añadido`)], flags: MessageFlags.Ephemeral });
    }
  }
};