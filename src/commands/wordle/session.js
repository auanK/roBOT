const sessions = new Map();

export function getWordleSession(groupId) {
  if (!sessions.has(groupId)) {
    sessions.set(groupId, createEmptySession());
  }
  return sessions.get(groupId);
}

export function resetWordleSession(groupId) {
  sessions.set(groupId, createEmptySession());
}

function createEmptySession() {
  return {
    started: false,
    date: "",
    participants: [],
  };
}
