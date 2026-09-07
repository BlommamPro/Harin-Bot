import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from "discord.js";
import {
  createEmbed,
  successEmbed,
  errorEmbed,
  COLORS,
} from "../../utils/embeds.js";
import { LevelConfig } from "../../models/LevelConfig.js";
import { GuildLevel } from "../../models/GuildLevel.js";
import { emojis } from "../../utils/emojis.js";

export default {
  CMD: new SlashCommandBuilder()
    .setName("levelconfig")
    .setDescription("⚙️ Configura el sistema de niveles del servidor")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("enable")
        .setDescription("🔧 Activar o desactivar el sistema de niveles")
        .addBooleanOption((opt) =>
          opt
            .setName("estado")
            .setDescription("true = activado, false = desactivado")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("role")
        .setDescription("🎭 Dar un rol al subir de nivel")
        .addIntegerOption((opt) =>
          opt
            .setName("nivel")
            .setDescription("Nivel requerido")
            .setRequired(true)
            .setMinValue(1),
        )
        .addRoleOption((opt) =>
          opt.setName("rol").setDescription("Rol a dar").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("removerole")
        .setDescription("🗑️ Quitar rol de un nivel")
        .addIntegerOption((opt) =>
          opt.setName("nivel").setDescription("Nivel").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("📢 Configurar canal de anuncios de nivel")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de anuncios")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("message")
        .setDescription("📝 Personalizar mensaje de subida de nivel")
        .addStringOption((opt) =>
          opt
            .setName("texto")
            .setDescription(
              "Mensaje (usa {user} para el usuario, {level} para el nivel)",
            )
            .setRequired(true)
            .setMaxLength(200),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ignore")
        .setDescription("🚫 Excluir un canal de la obtención de XP")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal a excluir")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("unignore")
        .setDescription("✅ Dejar de excluir un canal de la obtención de XP")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal a incluir nuevamente")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reset")
        .setDescription(
          "🔄 Reiniciar niveles de un usuario o todos (SOLO EN ESTE SERVIDOR)",
        )
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription(
              "Usuario a reiniciar (dejar vacío para TODOS en este servidor)",
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("📋 Ver configuración actual"),
    ),

  PERMISSIONS: ["Administrator"],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 5,
  GUILD_ONLY: true,

  async execute(client, interaction, guildData, userData) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === "enable") {
      const enable = interaction.options.getBoolean("estado");
      await LevelConfig.findOneAndUpdate(
        { guildId },
        { enabled: enable },
        { upsert: true, new: true },
      );
      return interaction.reply({
        embeds: [
          successEmbed(
            `✅ Sistema de niveles: ${enable ? `${emojis.a_on} Activado` : `${emojis.a_off} Desactivado`}`,
          ),
        ],
      });
    }

    if (sub === "role") {
      const level = interaction.options.getInteger("nivel");
      const role = interaction.options.getRole("rol");

      if (!interaction.guild.members.me.permissions.has("ManageRoles")) {
        return interaction.reply({
          embeds: [errorEmbed("❌ No tengo permiso para gestionar roles.")],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (
        role.position >= interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `❌ El rol ${role} está por encima de mi rol más alto. No puedo asignarlo.`,
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { $pull: { roles: { level } } },
        { upsert: true },
      );
      await LevelConfig.findOneAndUpdate(
        { guildId },
        { $push: { roles: { level, roleId: role.id } } },
        { upsert: true, new: true },
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `✅ Al llegar al nivel **${level}** se dará el rol ${role}.`,
          ),
        ],
      });
    }

    if (sub === "removerole") {
      const level = interaction.options.getInteger("nivel");

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { $pull: { roles: { level } } },
      );
      return interaction.reply({
        embeds: [successEmbed(`✅ Rol del nivel **${level}** eliminado.`)],
      });
    }

    if (sub === "channel") {
      const channel = interaction.options.getChannel("canal");

      const botPerms = channel.permissionsFor(interaction.guild.members.me);
      if (!botPerms.has("SendMessages") || !botPerms.has("EmbedLinks")) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `❌ No tengo permisos para enviar mensajes o embeds en ${channel}.`,
            ),
          ],
        });
      }

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { announceChannel: channel.id },
        { upsert: true },
      );
      return interaction.reply({
        embeds: [successEmbed(`✅ Canal de anuncios de niveles: ${channel}`)],
      });
    }

    if (sub === "message") {
      const text = interaction.options.getString("texto");

      if (!text.includes("{user}") || !text.includes("{level}")) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              "❌ El mensaje debe contener `{user}` y `{level}` para funcionar correctamente.",
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { levelUpMessage: text },
        { upsert: true, new: true },
      );
      return interaction.reply({
        embeds: [
          successEmbed(
            `✅ Mensaje de subida de nivel actualizado:\n\n` +
              `📝 ${text.replace("{user}", "@usuario").replace("{level}", "10")}`,
          ),
        ],
      });
    }

    if (sub === "ignore") {
      const channel = interaction.options.getChannel("canal");

      const config = await LevelConfig.findOne({ guildId });
      if (config?.ignoredChannels?.includes(channel.id)) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `❌ El canal ${channel} ya está en la lista de excluidos.`,
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { $addToSet: { ignoredChannels: channel.id } },
        { upsert: true, new: true },
      );
      return interaction.reply({
        embeds: [
          successEmbed(`🚫 Canal ${channel} excluido de la obtención de XP.`),
        ],
      });
    }

    if (sub === "unignore") {
      const channel = interaction.options.getChannel("canal");

      const config = await LevelConfig.findOne({ guildId });
      if (!config?.ignoredChannels?.includes(channel.id)) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `❌ El canal ${channel} no está en la lista de excluidos.`,
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      await LevelConfig.findOneAndUpdate(
        { guildId },
        { $pull: { ignoredChannels: channel.id } },
        { upsert: true, new: true },
      );
      return interaction.reply({
        embeds: [
          successEmbed(
            `✅ Canal ${channel} ya no está excluido de la obtención de XP.`,
          ),
        ],
      });
    }

    if (sub === "reset") {
      const target = interaction.options.getUser("usuario");

      if (target) {
        let userLevel = await GuildLevel.findOne({
          guildId,
          userId: target.id,
        });

        if (userLevel) {
          userLevel.xp = 0;
          userLevel.level = 1;
          await userLevel.save();
        } else {
          await GuildLevel.create({
            guildId,
            userId: target.id,
            xp: 0,
            level: 1,
          });
        }

        return interaction.reply({
          embeds: [
            successEmbed(
              `✅ Nivel de ${target} reiniciado en **${interaction.guild.name}**.`,
            ),
          ],
        });
      } else {
        const deletedCount = await GuildLevel.deleteMany({ guildId });
        return interaction.reply({
          embeds: [
            successEmbed(
              `✅ Niveles de **${deletedCount.deletedCount}** usuarios reiniciados en **${interaction.guild.name}**.`,
            ),
          ],
        });
      }
    }

    if (sub === "view") {
      const config = await LevelConfig.findOne({ guildId });

      const rolesText = config?.roles?.length
        ? config.roles
            .map((r) => `Nivel **${r.level}**: <@&${r.roleId}>`)
            .join("\n")
        : "Ninguno";

      const ignoredText = config?.ignoredChannels?.length
        ? config.ignoredChannels.map((id) => `<#${id}>`).join(", ")
        : "Ninguno";

      const embed = createEmbed({
        color: COLORS.INFO,
        title: "⚙️ Configuración de Niveles",
        description: [
          `**📊 Estado:** ${config?.enabled ? `${emojis.on} Activado` : `${emojis.off} Desactivado`}`,
          `**📢 Canal anuncios:** ${config?.announceChannel ? `<#${config.announceChannel}>` : "No configurado"}`,
          `**📝 Mensaje:** ${config?.levelUpMessage || "🎉 ¡{user} ha subido al nivel **{level}**!"}`,
          `**🚫 Canales excluidos:** ${ignoredText}`,
          `**🎭 Roles por nivel:**\n${rolesText}`,
          `**⚙️ XP por mensaje:** ${config?.xpMin || 15} - ${config?.xpMax || 25}`,
          `**⏱️ Cooldown:** ${config?.cooldownSeconds || 60} segundos`,
        ].join("\n"),
        footer: {
          text: `Usa /levelconfig <subcomando> para cambiar ajustes`,
          icon: interaction.user.displayAvatarURL(),
        },
      });

      return interaction.reply({ embeds: [embed] });
    }
  },
};
