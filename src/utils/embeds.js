import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { COLORS, EMOJIS, ICONS, BRANDING } from './embedColors.js';

export { COLORS, EMOJIS, ICONS, BRANDING };

export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.DEFAULT)
    .setTimestamp();

  if (options.title) {
    embed.setTitle(options.title);
  }

  if (options.author) {
    embed.setAuthor({
      name: options.author.name,
      iconURL: options.author.icon,
      url: options.author.url,
    });
  }

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (options.fields) {
    const fields = options.fields.slice(0, 25);
    for (let i = 0; i < fields.length; i += 3) {
      embed.addFields(fields.slice(i, i + 3));
    }
  }

  if (options.thumbnail) {
    embed.setThumbnail(
      typeof options.thumbnail === 'string'
        ? options.thumbnail
        : options.thumbnail.url
    );
  }

  if (options.image) {
    embed.setImage(
      typeof options.image === 'string' ? options.image : options.image.url
    );
  }

  if (options.footer) {
    embed.setFooter({
      text: options.footer.text,
      iconURL: options.footer.icon || BRANDING.LOGO_URL,
    });
  } else {
    embed.setFooter({
      text: BRANDING.FOOTER_TEXT,
      iconURL: BRANDING.LOGO_URL,
    });
  }

  if (options.timestamp === false) {
    embed.setTimestamp(null);
  }

  return embed;
}

export function successEmbed(description, title = `${EMOJIS.SUCCESS} Éxito`) {
  return createEmbed({
    color: COLORS.SUCCESS,
    title,
    description,
    thumbnail: ICONS.SUCCESS,
  });
}

export function errorEmbed(description, title = `${EMOJIS.ERROR} Error`) {
  return createEmbed({
    color: COLORS.ERROR,
    title,
    description,
    thumbnail: ICONS.ERROR,
  });
}

export function warningEmbed(description, title = `${EMOJIS.WARNING} Advertencia`) {
  return createEmbed({
    color: COLORS.WARNING,
    title,
    description,
    thumbnail: ICONS.WARNING,
  });
}

export function infoEmbed(description, title = `${EMOJIS.INFO} Información`) {
  return createEmbed({
    color: COLORS.INFO,
    title,
    description,
    thumbnail: ICONS.INFO,
  });
}

export function economyEmbed(description, title = `${EMOJIS.ECONOMY} Economía`) {
  return createEmbed({
    color: COLORS.ECONOMY,
    title,
    description,
    thumbnail: ICONS.ECONOMY,
  });
}

export function levelEmbed(description, title = `${EMOJIS.LEVELING} Niveles`) {
  return createEmbed({
    color: COLORS.LEVELING,
    title,
    description,
    thumbnail: ICONS.LEVELING,
  });
}

export function moderationEmbed(description, title = `${EMOJIS.MODERATION} Moderación`) {
  return createEmbed({
    color: COLORS.MODERATION,
    title,
    description,
    thumbnail: ICONS.MODERATION,
  });
}

export function giveawayEmbed(description, title = `${EMOJIS.GIVEAWAY} Sorteo`) {
  return createEmbed({
    color: COLORS.GIVEAWAY,
    title,
    description,
    thumbnail: ICONS.GIVEAWAY,
  });
}

export function ownerEmbed(description, title = `${EMOJIS.OWNER} Panel de Owner`) {
  return createEmbed({
    color: COLORS.OWNER,
    title,
    description,
  });
}

export function cooldownEmbed(timeLeft) {
  return createEmbed({
    color: config.cooldownColor || COLORS.WARNING,
    title: `${EMOJIS.TIMER} En cooldown`,
    description: `${EMOJIS.TIMER} Espera **${timeLeft}** segundos antes de volver a usar esto.`,
    thumbnail: ICONS.WARNING,
  });
}

export function clearEmbed(description, title = `${EMOJIS.CLEAR} Mensajes borrados`) {
  return createEmbed({
    color: COLORS.SUCCESS,
    title,
    description,
    thumbnail: ICONS.CLEAR,
  });
}

export function bankEmbed(description, title = `${EMOJIS.BANK} Banco`) {
  return createEmbed({
    color: COLORS.ECONOMY,
    title,
    description,
    thumbnail: ICONS.ECONOMY,
  });
}