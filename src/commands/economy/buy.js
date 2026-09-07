import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getShopItem, updateShopItemStock } from '../../utils/shop.js';
import { updateUserData } from '../../utils/guildData.js';
import { checkDbCooldown, setDbCooldown } from '../../utils/economyCooldowns.js';
import { checkAndAwardBadge } from '../../utils/badges.js';
import { User } from '../../models/User.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('🛒 Compra un item de la tienda')
    .setDMPermission(false)
    .addStringOption(opt =>
      opt.setName('item')
         .setDescription('ID del item a comprar')
         .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('cantidad')
         .setDescription('Cantidad a comprar (por defecto: 1)')
         .setRequired(false)
         .setMinValue(1)
    ),

  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 0,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const itemId = interaction.options.getString('item').toLowerCase();
    const quantity = interaction.options.getInteger('cantidad') || 1;

    const cd = await checkDbCooldown(interaction.user.id, 'buy', 0.08);
    if (cd.onCooldown) {
      return interaction.reply({
        embeds: [errorEmbed(`⏳ Espera un momento antes de comprar de nuevo. <t:${cd.nextTimestamp}:R>.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    const item = await getShopItem(interaction.guildId, itemId);
    if (!item) {
      return interaction.reply({
        embeds: [errorEmbed('❌ Ese item no existe en la tienda.')],
        flags: MessageFlags.Ephemeral
      });
    }

    if (!item.enabled) {
      return interaction.reply({
        embeds: [errorEmbed('❌ Este item está actualmente desactivado.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const totalPrice = item.price * quantity;

    if ((userData?.balance || 0) < totalPrice) {
      return interaction.reply({
        embeds: [errorEmbed(`❌ No tienes suficientes coins. Necesitas **${totalPrice} coins** y tienes **${userData.balance}**.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (item.stock >= 0 && item.stock < quantity) {
      return interaction.reply({
        embeds: [errorEmbed(`❌ No hay suficiente stock. Quedan **${item.stock}** unidades.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (item.roleId) {
      const role = interaction.guild.roles.cache.get(item.roleId);
      if (role) {
        if (interaction.member.roles.cache.has(role.id)) {
          return interaction.reply({
            embeds: [errorEmbed(`❌ Ya tienes el rol ${role}. No puedes comprarlo de nuevo.`)],
            flags: MessageFlags.Ephemeral
          });
        }
      }

      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has('ManageRoles')) {
        return interaction.reply({
          embeds: [errorEmbed('❌ No tengo permiso para gestionar roles.')],
          flags: MessageFlags.Ephemeral
        });
      }

      if (role && role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed(`❌ El rol ${role} está por encima de mi rol más alto. No puedo asignarlo.`)],
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        await interaction.member.roles.add(role);
      } catch {
        return interaction.reply({
          embeds: [errorEmbed('❌ No pude darte el rol.')],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    const user = await User.findOne({ userId: interaction.user.id });
    const existingItem = user?.inventory?.find(i => i.itemId === item.itemId);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      
      await User.findOneAndUpdate(
        { 
          userId: interaction.user.id, 
          'inventory.itemId': item.itemId 
        },
        {
          $inc: {
            balance: -totalPrice,
            totalPurchases: quantity
          },
          $set: {
            'inventory.$.quantity': newQty
          }
        },
        { new: true }
      );
    } else {
      await updateUserData(interaction.user.id, {
        $inc: { 
          balance: -totalPrice, 
          totalPurchases: quantity 
        },
        $push: { 
          inventory: { 
            itemId: item.itemId, 
            name: item.name, 
            quantity: quantity, 
            boughtAt: new Date() 
          } 
        }
      });
    }

    if (item.stock >= 0) {
      await updateShopItemStock(interaction.guildId, itemId, item.stock - quantity);
    }

    await setDbCooldown(interaction.user.id, 'buy');

    const newTotal = (userData.totalPurchases || 0) + quantity;
    if (newTotal >= 10) await checkAndAwardBadge(interaction.user.id, 'shopaholic', client);

    const embed = successEmbed(
      `✅ Compraste **${quantity}x ${item.name}** por **${totalPrice} coins**!` +
      (item.roleId ? `\n🎁 Se te ha otorgado el rol <@&${item.roleId}>` : '')
    );
    embed.setTitle('🛒 Compra Exitosa');

    await interaction.reply({ embeds: [embed] });
  }
};