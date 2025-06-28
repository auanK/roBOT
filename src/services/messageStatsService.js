import * as db from "../database/database.js";

export async function recordMessage(groupId, userId) {
  const logEntry = {
    groupId,
    userId,
    timestamp: new Date().toISOString(),
  };

  await db.messageLogs.add(logEntry);
}
