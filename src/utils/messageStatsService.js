import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statsPath = path.join(__dirname, "../data/stats.messages.json");

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

export async function recordMessage(groupId, userId) {
  const stats = await loadStats();
  const now = new Date();

  const dayOfWeek = now.getDay().toString();
  const hour = now.getHours().toString();

  if (!stats[groupId]) {
    stats[groupId] = {};
  }
  if (!stats[groupId][dayOfWeek]) {
    stats[groupId][dayOfWeek] = {};
  }
  if (!stats[groupId][dayOfWeek][hour]) {
    stats[groupId][dayOfWeek][hour] = {};
  }
  if (!stats[groupId][dayOfWeek][hour][userId]) {
    stats[groupId][dayOfWeek][hour][userId] = 0;
  }

  stats[groupId][dayOfWeek][hour][userId]++;

  await saveStats(stats);
}
