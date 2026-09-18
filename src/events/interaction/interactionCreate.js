import { MessageFlags, EmbedBuilder } from "discord.js";
import { config } from "../../../config/config.js";
import { checkCooldown } from "../../utils/cooldowns.js";
import {
  checkPermissions,
  checkBotPermissions,
} from "../../utils/permissions.js";
import { parseCustomId } from "../../utils/parseCustomId.js";
import { errorEmbed, cooldownEmbed } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";
import { getGuildData, getUserData } from "../../utils/guildData.js";

let supportChannel = null;

export function setSupportChannelForErrors(channel) {
  supportChannel = channel;
}

async function sendCommandErrorToSupport(interaction, error) {
  if (!supportChannel) {
    logger.warn('No hay canal de soporte configurado para enviar errores.');
    return;
  }

  const stack = error?.stack || "Sin stack trace";
  const message = error?.message || String(error);
  const truncatedStack =
    stack.length > 1500 ? stack.slice(0, 1500) + "..." : stack;

  const guildName = interaction.guild?.name || "DM";
  const guildId = interaction.guildId || "N/A";

  const embed = new EmbedBuilder()
    .setColor(config.errorColor)
    .setTitle("⚠️ Error en Comando")
    .setDescription(
      `**/${interaction.commandName || interaction.customId}** falló al ejecutarse.`,
    )
    .addFields(
      {
        name: "👤 Usuario",
        value: `${interaction.user.tag} (\`${interaction.user.id}\`)`,
        inline: true,
      },
      {
        name: "🏘️ Servidor",
        value: `${guildName} (\`${guildId}\`)`,
        inline: true,
      },
      { name: "📋 Canal", value: `<#${interaction.channelId}>`, inline: true },
      { name: "📝 Error", value: `\`\`\`${message.slice(0, 1000)}\`\`\`` },
      { name: "📚 Stack Trace", value: `\`\`\`js\n${truncatedStack}\n\`\`\`` },
    )
    .setTimestamp();

  try {
    await supportChannel.send({ embeds: [embed] });
  } catch (err) {
    logger.error(
      "No pude enviar error de comando al canal de soporte:",
      err.message,
    );
  }
}

export default {
  name: "interactionCreate",
  once: false,

  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      if (command.OWNER && !config.ownerIds.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed("Solo los owners pueden usar este comando")],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (command.GUILD_ONLY && !interaction.guild) {
        return interaction.reply({
          embeds: [errorEmbed("Este comando solo se puede usar en servidores")],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (command.NSFW && !interaction.channel.nsfw) {
        return interaction.reply({
          embeds: [
            errorEmbed("Este comando solo se puede usar en canales NSFW"),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (command.PERMISSIONS?.length && interaction.guild) {
        const permCheck = checkPermissions(
          interaction.member,
          command.PERMISSIONS,
        );
        if (!permCheck.allowed) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                `Necesitas los permisos: \`${permCheck.missing.join(", ")}\``,
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (command.BOT_PERMISSIONS?.length && interaction.guild) {
        const botPermCheck = checkBotPermissions(
          interaction.guild.members.me,
          command.BOT_PERMISSIONS,
        );
        if (!botPermCheck.allowed) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                `Necesito los permisos: \`${botPermCheck.missing.join(", ")}\``,
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      const { onCooldown, timeLeft } = checkCooldown(
        client,
        command.CMD.name,
        interaction.user.id,
        command.COOLDOWN || 3,
      );
      if (onCooldown) {
        return interaction.reply({
          embeds: [cooldownEmbed(timeLeft)],
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        let guildData = null;
        let userData = null;

        if (interaction.guildId) {
          guildData = await getGuildData(interaction.guildId);
        }

        userData = await getUserData(
          interaction.user.id,
          interaction.user.username,
        );

        await command.execute(client, interaction, guildData, userData);
        logger.cmd(`[SLASH] ${interaction.user.tag} → /${command.CMD.name}`);
      } catch (err) {
        logger.error(`Error en /${command.CMD.name}:`, err);
        await sendCommandErrorToSupport(interaction, err);

        const replyPayload = {
          embeds: [errorEmbed("Ocurrió un error al ejecutar el comando")],
          flags: MessageFlags.Ephemeral,
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyPayload);
          } else {
            await interaction.reply(replyPayload);
          }
        } catch (replyErr) {
          logger.error(
            `No pude responder al error de /${command.CMD.name}:`,
            replyErr.message,
          );
        }
      }
    } else if (interaction.isContextMenuCommand()) {
      const menu = client.contextMenus.get(interaction.commandName);
      if (!menu) return;

      try {
        let guildData = null;
        let userData = null;

        if (interaction.guildId) {
          guildData = await getGuildData(interaction.guildId);
        }

        userData = await getUserData(
          interaction.user.id,
          interaction.user.username,
        );

        await menu.execute(client, interaction, guildData, userData);
        logger.cmd(`[CTX] ${interaction.user.tag} → ${menu.CMD.name}`);
      } catch (err) {
        logger.error(`Error en context menu ${menu.CMD.name}:`, err);
        await sendCommandErrorToSupport(interaction, err);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              embeds: [errorEmbed("Error al ejecutar el menú contextual")],
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.reply({
              embeds: [errorEmbed("Error al ejecutar el menú contextual")],
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch {
        }
      }
    } else if (interaction.isButton()) {
      await handleComponent(client, interaction, "buttons");
    } else if (interaction.isAnySelectMenu()) {
      await handleComponent(client, interaction, "selectMenus");
    } else if (interaction.isModalSubmit()) {
      await handleComponent(client, interaction, "modals");
    }
  },
};

async function handleComponent(client, interaction, type) {
  const collection = client[type];
  let handler = null;
  let args = [];

  handler = collection.get(interaction.customId);

  if (!handler) {
    for (const [pattern, h] of collection) {
      try {
        const parsed = parseCustomId(interaction.customId, pattern);
        if (parsed !== null) {
          handler = h;
          args = parsed;
          break;
        }
      } catch (err) {
        logger.warn(
          `Error parseando customId: ${interaction.customId}`,
          err.message,
        );
      }
    }
  }

  if (!handler) {
    logger.warn(`Componente no encontrado: ${interaction.customId}`);
    return;
  }

  if (handler.OWNER && !config.ownerIds.includes(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed("Solo los owners pueden usar esto")],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (handler.PERMISSIONS?.length && interaction.guild) {
    const permCheck = checkPermissions(interaction.member, handler.PERMISSIONS);
    if (!permCheck.allowed) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `Necesitas los permisos: \`${permCheck.missing.join(", ")}\``,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (handler.BOT_PERMISSIONS?.length && interaction.guild) {
    const botPermCheck = checkBotPermissions(
      interaction.guild.members.me,
      handler.BOT_PERMISSIONS,
    );
    if (!botPermCheck.allowed) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `Necesito los permisos: \`${botPermCheck.missing.join(", ")}\``,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const { onCooldown, timeLeft } = checkCooldown(
    client,
    handler.customId,
    interaction.user.id,
    handler.COOLDOWN || 3,
  );
  if (onCooldown) {
    return interaction.reply({
      embeds: [cooldownEmbed(timeLeft)],
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    let guildData = null;
    let userData = null;

    if (interaction.guildId) {
      guildData = await getGuildData(interaction.guildId);
    }

    userData = await getUserData(
      interaction.user.id,
      interaction.user.username,
    );

    await handler.execute(client, interaction, args, guildData, userData);
    logger.cmd(
      `[${type.toUpperCase()}] ${interaction.user.tag} → ${interaction.customId}`,
    );
  } catch (err) {
    logger.error(`Error en ${type} ${interaction.customId}:`, err);
    await sendCommandErrorToSupport(interaction, err);
    const replyPayload = {
      embeds: [errorEmbed("Ocurrió un error")],
      flags: MessageFlags.Ephemeral,
    };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    } catch {
    }
  }
}