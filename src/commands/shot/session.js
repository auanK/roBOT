const sessions = new Map();

export function getShotSession(groupId) {
  if (!sessions.has(groupId)) {
    sessions.set(groupId, createEmptySession());
  }
  return sessions.get(groupId);
}

export function resetShotSession(groupId) {
  sessions.set(groupId, createEmptySession());
}

function createEmptySession() {
  return {
    started: false,
    barrel: [],
    currentBarrelIndex: 0,
    players: new Map(),
    turnOrder: [],
    currentTurnIndex: 0,
  };
}
