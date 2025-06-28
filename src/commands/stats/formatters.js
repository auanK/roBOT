import { daysOfWeek } from "./constants.js";
import { getUserName } from "../../services/userService.js";

function calculateTotals(statsSummary, dayFilter = null, hourFilter = null) {
  const userTotals = {};

  for (const summaryRow of statsSummary) {
    const { userId, dayOfWeek, hour, messageCount } = summaryRow;

    if (dayFilter && dayOfWeek.toString() !== dayFilter) continue;
    if (hourFilter && hour.toString() !== hourFilter) continue;

    userTotals[userId] = (userTotals[userId] || 0) + messageCount;
  }
  return userTotals;
}

export async function formatRankingReply(
  title,
  statsSummary,
  groupId,
  dayFilter = null,
  hourFilter = null
) {
  const userTotals = calculateTotals(statsSummary, dayFilter, hourFilter);
  const sortedUsers = Object.entries(userTotals).sort(([, a], [, b]) => b - a);

  if (sortedUsers.length === 0) {
    return "📊 Nenhuma mensagem encontrada para o filtro selecionado.";
  }

  let reply = `*${title}*\n\n`;
  const topUsers = sortedUsers.slice(0, 15);

  for (let index = 0; index < topUsers.length; index++) {
    const [userId, count] = topUsers[index];
    const medals = ["🥇", "🥈", "🥉"];
    const prefix = index < 3 ? medals[index] : ` ${index + 1}.`;
    const userName = await getUserName(userId, groupId);
    reply += `${prefix} *${userName}*: ${count} mensagens\n`;
  }

  return reply;
}

export async function formatWeeklyChampionsReply(statsSummary, groupId) {
  let reply = "📅 *Campeões da Semana (Por Dia)*\n\n";
  for (let i = 0; i < 7; i++) {
    const dayKey = i.toString();
    const userTotals = calculateTotals(statsSummary, dayKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = await getUserName(userId, groupId);
      reply += `• *${daysOfWeek[dayKey]}:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}

export async function formatHourlyChampionsReply(statsSummary, groupId) {
  let reply = "⏰ *Donos de Cada Hora (Geral)*\n\n";
  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString();
    const userTotals = calculateTotals(statsSummary, null, hourKey);
    const sortedUsers = Object.entries(userTotals).sort(
      ([, a], [, b]) => b - a
    );

    if (sortedUsers.length > 0) {
      const [userId, count] = sortedUsers[0];
      const userName = await getUserName(userId, groupId);
      reply += `• *${hourKey.padStart(
        2,
        "0"
      )}h:* ${userName} (${count} msgs)\n`;
    }
  }
  return reply;
}
