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
      url: options.author.url
    });
  }

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (options.fields) {
    const fields = options.fields.slice(0, 25);
    for (let i = 0; i < fields.length; i += 3) {
      const group = fields.slice(i, i + 3);
      embed.addFields(group);
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
      typeof options.image === 'string' 
        ? options.image 
        : options.image.url
    );
  }

  if (options.footer) {
    embed.setFooter({
      text: options.footer.text,
      iconURL: options.footer.icon || BRANDING.LOGO_URL
    });
  } else {
    embed.setFooter({ 
      text: '✦',
      iconURL: BRANDING.LOGO_URL
    });
  }

  if (options.timestamp === false) {
    embed.setTimestamp(null);
  }

  return embed;
}

// ===== EMBEDS PREDEFINIDOS =====

export function successEmbed(description, title = `${EMOJIS.SUCCESS} Éxito`) {
  return createEmbed({
    color: COLORS.SUCCESS,
    title: title,
    description: description,
    thumbnail: ICONS.SUCCESS,
  });
}

export function errorEmbed(description, title = `${EMOJIS.ERROR} Error`) {
  return createEmbed({
    color: COLORS.ERROR,
    title: title,
    description: description,
    thumbnail: ICONS.ERROR,
  });
}

export function warningEmbed(description, title = `${EMOJIS.WARNING} Advertencia`) {
  return createEmbed({
    color: COLORS.WARNING,
    title: title,
    description: description,
    thumbnail: ICONS.WARNING,
  });
}

export function infoEmbed(description, title = `${EMOJIS.INFO} Información`) {
  return createEmbed({
    color: COLORS.INFO,
    title: title,
    description: description,
    thumbnail: ICONS.INFO,
  });
}

export function economyEmbed(description, title = `${EMOJIS.ECONOMY} Economía`) {
  return createEmbed({
    color: COLORS.ECONOMY,
    title: title,
    description: description,
    thumbnail: ICONS.ECONOMY,
  });
}

export function levelEmbed(description, title = `${EMOJIS.LEVELING} Niveles`) {
  return createEmbed({
    color: COLORS.LEVELING,
    title: title,
    description: description,
    thumbnail: ICONS.LEVELING,
  });
}

export function moderationEmbed(description, title = `${EMOJIS.MODERATION} Moderación`) {
  return createEmbed({
    color: COLORS.MODERATION,
    title: title,
    description: description,
    thumbnail: ICONS.MODERATION,
  });
}

export function giveawayEmbed(description, title = `${EMOJIS.GIVEAWAY} Sorteo`) {
  return createEmbed({
    color: COLORS.GIVEAWAY,
    title: title,
    description: description,
    thumbnail: ICONS.GIVEAWAY,
  });
}

export function cooldownEmbed(timeLeft) {
  return createEmbed({
    color: config.cooldownColor || 0xFEE75C,
    title: `${EMOJIS.TIMER} En cooldown`,
    description: `${EMOJIS.TIMER} Espera **${timeLeft}** segundos antes de usar esto.`,
    thumbnail: ICONS.WARNING,
  });
}

export function clearEmbed(description, title = `${EMOJIS.CLEAR} Mensajes Borrados`) {
  return createEmbed({
    color: COLORS.SUCCESS,
    title: title,
    description: description,
    thumbnail: ICONS.CLEAR,
  });
}

export function bankEmbed(description, title = `${EMOJIS.BANK} Banco`) {
  return createEmbed({
    color: COLORS.ECONOMY,
    title: title,
    description: description,
    thumbnail: ICONS.ECONOMY,
  });
}