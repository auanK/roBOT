import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statsPath = path.join(__dirname, "../data/stats.group.json");

export async function loadStats() {
  try {
    const data = await readFile(statsPath, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveStats(data) {
  await writeFile(statsPath, JSON.stringify(data, null, 2));
}

export async function addPoints(
  groupId,
  userId,
  game,
  points = 0,
  result = "win"
) {
  const stats = await loadStats();

  if (!stats[groupId]) stats[groupId] = {};
  if (!stats[groupId][userId]) stats[groupId][userId] = {};

  if (!stats[groupId][userId][game]) {
    stats[groupId][userId][game] = {
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
    };
  }

  const entry = stats[groupId][userId][game];

  entry.points += points;

  if (result === "win") entry.wins += 1;
  else if (result === "loss") entry.losses += 1;
  else if (result === "draw") entry.draws += 1;

  await saveStats(stats);
}
