const sessions = new Map();

export function getBlackjackSession(groupId) {
  if (!sessions.has(groupId)) {
    sessions.set(groupId, createEmptySession());
  }
  return sessions.get(groupId);
}

export function resetBlackjackSession(groupId) {
  const session = createEmptySession();
  sessions.set(groupId, session);
  return session;
}

function createEmptySession() {
  return {
    started: false,
    players: new Map(),
    deck: [],
    dealer: {
      hand: [],
      total: 0,
      status: "waiting",
    },
  };
}
