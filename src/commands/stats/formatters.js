import { daysOfWeek } from "./constants.js";
import { getUserName } from "../../utils/userService.js";

function calculateTotals(groupStats, dayFilter = null, hourFilter = null) {
  const userTotals = {};
  const daysToIterate = dayFilter ? [dayFilter] : Object.keys(groupStats);

  for (const day of daysToIterate) {
    if (!groupStats[day]) continue;
    const hoursToIterate = hourFilter
      ? [hourFilter]
      : Object.keys(groupStats[day]);
    for (const hour of hoursToIterate) {
      if (!groupStats[day][hour]) continue;
      for (const userId in groupStats[day][hour]) {
        if (!userTotals[userId]) userTotals[userId] = 0;
        userTotals[userId] += groupStats[day][hour][userId];
      }
    }
  }
  return userTotals;
}

export async function formatRankingReply(
  title,
  groupStats,
  groupId,
  dayFilter = null,
  hourFilter = null
) {
  const userTotals = calculateTotals(groupStats, dayFilter, hourFilter);
  const sortedUsers = Object.entries(userTotals).sort(([, a], [, b]) => b - a);

  if (sortedUsers.length === 0) {
    return "📊 Nenhuma mensagem encontrada para o filtro selecionado.";
  }

  let reply = `*${title}*\n\n`;
  for (let index = 0; index < Math.min(15, sortedUsers.length); index++) {
    const [userId, count] = sortedUsers[index];
    const medals = ["🥇", "🥈", "🥉"];
    const prefix = index < 3 ? medals[index] : ` ${index + 1}.`;
    const userName = await getUserName(userId, groupId);
    reply += `${prefix} *${userName}*: ${count} mensagens\n`;
  }

  return reply;
}

export async function formatWeeklyChampionsReply(groupStats, groupId) {
  let reply = "📅 *Campeões da Semana (Por Dia)*\n\n";
  for (let i = 0; i < 7; i++) {
    const dayKey = i.toString();
    const userTotals = calculateTotals(groupStats, dayKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = await getUserName(userId, groupId); // ✅
      reply += `• *${daysOfWeek[dayKey]}:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}

export async function formatHourlyChampionsReply(groupStats, groupId) {
  let reply = "⏰ *Donos de Cada Hora (Geral)*\n\n";
  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString();
    const userTotals = calculateTotals(groupStats, null, hourKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = await getUserName(userId, groupId); // ✅
      reply += `• *${hourKey.padStart(
        2,
        "0"
      )}h:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}
