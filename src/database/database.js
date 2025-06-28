import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../data/database.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const schemaSQL = `
    CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, isAuthorized INTEGER NOT NULL DEFAULT 0, aliasFor TEXT, createdAt TEXT NOT NULL, FOREIGN KEY (aliasFor) REFERENCES groups(id));
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, pushname TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles (userId TEXT NOT NULL, groupId TEXT NOT NULL, nickname TEXT, description TEXT, PRIMARY KEY (userId, groupId), FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS game_stats_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, groupId TEXT NOT NULL, game TEXT NOT NULL, result TEXT NOT NULL, pointsEarned INTEGER NOT NULL DEFAULT 0, timestamp TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS game_stats_summary (userId TEXT NOT NULL, groupId TEXT NOT NULL, totalPoints INTEGER NOT NULL DEFAULT 0, totalWins INTEGER NOT NULL DEFAULT 0, totalLosses INTEGER NOT NULL DEFAULT 0, totalDraws INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (userId, groupId), FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS message_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, groupId TEXT NOT NULL, timestamp TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS message_stats_summary (userId TEXT NOT NULL, groupId TEXT NOT NULL, dayOfWeek INTEGER NOT NULL, hour INTEGER NOT NULL, messageCount INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (userId, groupId, dayOfWeek, hour), FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS wordle_games (id INTEGER PRIMARY KEY AUTOINCREMENT, groupId TEXT NOT NULL, date TEXT NOT NULL, word TEXT NOT NULL, guesses TEXT NOT NULL, participants TEXT NOT NULL, invalidLetters TEXT, finished INTEGER NOT NULL DEFAULT 0, UNIQUE (groupId, date), FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS schedules (id TEXT PRIMARY KEY, type TEXT NOT NULL, targetGroupId TEXT NOT NULL, cronExpressions TEXT NOT NULL, isOneTime INTEGER NOT NULL DEFAULT 0, createdBy TEXT, payload TEXT NOT NULL, FOREIGN KEY (targetGroupId) REFERENCES groups(id) ON DELETE CASCADE, FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE);
`;

db.exec(schemaSQL);
console.log("Banco de dados conectado e schema inicializado com sucesso.");

const insertMessageLogStmt = db.prepare(
  "INSERT INTO message_logs (userId, groupId, timestamp) VALUES (@userId, @groupId, @timestamp)"
);
const upsertMessageSummaryStmt = db.prepare(`
    INSERT INTO message_stats_summary (userId, groupId, dayOfWeek, hour, messageCount) VALUES (@userId, @groupId, @dayOfWeek, @hour, 1)
    ON CONFLICT(userId, groupId, dayOfWeek, hour) DO UPDATE SET messageCount = messageCount + 1
`);
const insertGameLogStmt = db.prepare(
  "INSERT INTO game_stats_logs (userId, groupId, game, result, pointsEarned, timestamp) VALUES (@userId, @groupId, @game, @result, @pointsEarned, @timestamp)"
);
const upsertGameSummaryStmt = db.prepare(`
    INSERT INTO game_stats_summary (userId, groupId, totalPoints, totalWins, totalLosses, totalDraws) VALUES (@userId, @groupId, @points, @wins, @losses, @draws)
    ON CONFLICT(userId, groupId) DO UPDATE SET
        totalPoints = totalPoints + @points,
        totalWins = totalWins + @wins,
        totalLosses = totalLosses + @losses,
        totalDraws = totalDraws + @draws
`);

const recordMessageTx = db.transaction((log) => {
  const date = new Date(log.timestamp);
  insertMessageLogStmt.run(log);
  upsertMessageSummaryStmt.run({
    ...log,
    dayOfWeek: date.getDay(),
    hour: date.getHours(),
  });
});
const recordGameResultTx = db.transaction((gameResult) => {
  insertGameLogStmt.run({ ...gameResult, timestamp: new Date().toISOString() });
  upsertGameSummaryStmt.run({
    userId: gameResult.userId,
    groupId: gameResult.groupId,
    points: gameResult.pointsEarned,
    wins: gameResult.result === "win" ? 1 : 0,
    losses: gameResult.result === "loss" ? 1 : 0,
    draws: gameResult.result === "draw" ? 1 : 0,
  });
});

export const users = {
  get: (userId) => db.prepare("SELECT * FROM users WHERE id = ?").get(userId),
  getAll: () => db.prepare("SELECT * FROM users").all(),
  save: (userData) =>
    db
      .prepare(
        "INSERT INTO users (id, pushname, createdAt) VALUES (@id, @pushname, @createdAt) ON CONFLICT(id) DO UPDATE SET pushname = excluded.pushname"
      )
      .run(userData),
};

export const groups = {
  get: (groupId) =>
    db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId),
  getAll: () => db.prepare("SELECT * FROM groups").all(),
  save: (groupData) =>
    db
      .prepare(
        "INSERT INTO groups (id, name, isAuthorized, aliasFor, createdAt) VALUES (@id, @name, @isAuthorized, @aliasFor, @createdAt) ON CONFLICT(id) DO UPDATE SET name = excluded.name, isAuthorized = excluded.isAuthorized, aliasFor = excluded.aliasFor"
      )
      .run({ ...groupData, isAuthorized: groupData.isAuthorized ? 1 : 0 }),
};

export const profiles = {
  get: (userId, groupId) =>
    db
      .prepare("SELECT * FROM profiles WHERE userId = ? AND groupId = ?")
      .get(userId, groupId),
  save: (profileData) =>
    db
      .prepare(
        "INSERT INTO profiles (userId, groupId, nickname, description) VALUES (@userId, @groupId, @nickname, @description) ON CONFLICT(userId, groupId) DO UPDATE SET nickname = excluded.nickname, description = excluded.description"
      )
      .run(profileData),
};

export const schedules = {
  getAll: () => {
    const rows = db.prepare("SELECT * FROM schedules").all();
    return rows.map((row) => ({
      ...row,
      cronExpressions: JSON.parse(row.cronExpressions),
      payload: JSON.parse(row.payload),
      isOneTime: Boolean(row.isOneTime),
    }));
  },
};

export const messageLogs = {
  add: (logEntry) => recordMessageTx(logEntry),
  getSummaryByGroup: (groupId) =>
    db
      .prepare("SELECT * FROM message_stats_summary WHERE groupId = ?")
      .all(groupId),
  getSummaryByUser: (userId, groupId) =>
    db
      .prepare(
        "SELECT * FROM message_stats_summary WHERE userId = ? AND groupId = ?"
      )
      .all(userId, groupId),
};

export const gameStats = {
  add: (gameResult) => recordGameResultTx(gameResult),
  getSummaryByGroup: (groupId) =>
    db
      .prepare("SELECT * FROM game_stats_summary WHERE groupId = ?")
      .all(groupId),
  getSummaryByUser: (userId, groupId) =>
    db
      .prepare(
        "SELECT * FROM game_stats_summary WHERE userId = ? AND groupId = ?"
      )
      .get(userId, groupId),
};

export const wordleGames = {
  get: (groupId, date) => {
    const row = db
      .prepare("SELECT * FROM wordle_games WHERE groupId = ? AND date = ?")
      .get(groupId, date);
    if (!row) return null;
    try {
      return {
        ...row,
        guesses: JSON.parse(row.guesses),
        participants: JSON.parse(row.participants),
        invalidLetters: JSON.parse(row.invalidLetters),
        finished: Boolean(row.finished),
      };
    } catch {
      return row;
    }
  },
  save: (gameData) => {
    const stmt = db.prepare(
      "INSERT INTO wordle_games (groupId, date, word, guesses, participants, invalidLetters, finished) VALUES (@groupId, @date, @word, @guesses, @participants, @invalidLetters, @finished) ON CONFLICT(groupId, date) DO UPDATE SET guesses = excluded.guesses, invalidLetters = excluded.invalidLetters, finished = excluded.finished"
    );
    stmt.run({
      ...gameData,
      guesses: JSON.stringify(gameData.guesses || []),
      participants: JSON.stringify(gameData.participants || []),
      invalidLetters: JSON.stringify(gameData.invalidLetters || []),
      finished: gameData.finished ? 1 : 0,
    });
  },
  delete: (groupId, date) =>
    db
      .prepare("DELETE FROM wordle_games WHERE groupId = ? AND date = ?")
      .run(groupId, date),
};

export { db };
