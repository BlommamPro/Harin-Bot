export const blackjackGames = new Map();

export function createGame(gameId, data) {
  blackjackGames.set(gameId, {
    ...data,
    createdAt: Date.now(),
  });
}

export function getGame(gameId) {
  return blackjackGames.get(gameId);
}

export function deleteGame(gameId) {
  blackjackGames.delete(gameId);
}

export function sweepOldGames(maxAgeMs = 15 * 60 * 1000) {
  const now = Date.now();
  for (const [id, g] of blackjackGames) {
    if (now - g.createdAt > maxAgeMs) blackjackGames.delete(id);
  }
}