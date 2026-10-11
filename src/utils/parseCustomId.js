export function parseCustomId(customId, pattern) {
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = escapedPattern.replace(/\\{\\}/g, '(.+?)');
  const regex = new RegExp(`^${regexPattern}$`);
  const match = customId.match(regex);

  if (!match) return null;
  return match.slice(1);
}