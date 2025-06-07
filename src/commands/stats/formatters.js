import { daysOfWeek } from "./constants.js";

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

export function formatRankingReply(
  title,
  groupStats,
  users,
  dayFilter = null,
  hourFilter = null
) {
  const userTotals = calculateTotals(groupStats, dayFilter, hourFilter);
  const sortedUsers = Object.entries(userTotals).sort(([, a], [, b]) => b - a);

  if (sortedUsers.length === 0) {
    return "📊 Nenhuma mensagem encontrada para o filtro selecionado.";
  }

  let reply = `*${title}*\n\n`;
  sortedUsers.slice(0, 15).forEach(([userId, count], index) => {
    const medals = ["🥇", "🥈", "🥉"];
    const prefix = index < 3 ? medals[index] : ` ${index + 1}.`;
    const userName =
      users[userId]?.pushname || `Usuário (${userId.slice(0, 4)})`;
    reply += `${prefix} *${userName}*: ${count} mensagens\n`;
  });
  return reply;
}

export function formatWeeklyChampionsReply(groupStats, users) {
  let reply = "📅 *Campeões da Semana (Por Dia)*\n\n";
  for (let i = 0; i < 7; i++) {
    const dayKey = i.toString();
    const userTotals = calculateTotals(groupStats, dayKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = users[userId]?.pushname || "Desconhecido";
      reply += `• *${daysOfWeek[dayKey]}:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}

export function formatHourlyChampionsReply(groupStats, users) {
  let reply = "⏰ *Donos de Cada Hora (Geral)*\n\n";
  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString();
    const userTotals = calculateTotals(groupStats, null, hourKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = users[userId]?.pushname || "Desconhecido";
      reply += `• *${hourKey.padStart(
        2,
        "0"
      )}h:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}
