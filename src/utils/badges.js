export const BADGE_DEFINITIONS = {
  early_bird: { emoji: '🌅', name: 'Early Bird', desc: 'Primer daily reclamado' },
  level_10: { emoji: '⭐', name: 'Veterano', desc: 'Llegar a nivel 10 global' },
  level_50: { emoji: '👑', name: 'Leyenda', desc: 'Llegar a nivel 50 global' }
};

export function getAllBadgesText(badgeIds) {
  if (!badgeIds || badgeIds.length === 0) return 'Ninguna';
  return badgeIds.map(id => {
    const b = BADGE_DEFINITIONS[id];
    return b ? `${b.emoji}` : `❓`;
  }).join(' ');
}

export function getBadgeDisplay(badgeId) {
  const b = BADGE_DEFINITIONS[badgeId];
  if (!b) return null;
  return `${b.emoji} **${b.name}** — ${b.desc}`;
}