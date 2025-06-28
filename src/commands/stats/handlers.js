import {
  formatRankingReply,
  formatWeeklyChampionsReply,
  formatHourlyChampionsReply,
} from "./formatters.js";
import { daysOfWeek } from "./constants.js";

export function handleStatsRequest(args, statsSummary, groupId) {
  const arg1 = args[0]?.toLowerCase();
  const arg2 = args[1]?.toLowerCase();

  if (!arg1) {
    return formatRankingReply(
      "🏆 Ranking Geral de Mensagens",
      statsSummary,
      groupId
    );
  }

  if (arg1 === "week") {
    return formatWeeklyChampionsReply(statsSummary, groupId);
  }

  if (arg1 === "hours") {
    return formatHourlyChampionsReply(statsSummary, groupId);
  }

  if (arg1 === "today") {
    const todayKey = new Date().getDay().toString();
    const title = `📊 Ranking de Hoje (${daysOfWeek[todayKey]})`;
    return formatRankingReply(title, statsSummary, groupId, todayKey);
  }

  if (arg1 === "now") {
    const now = new Date();
    const todayKey = now.getDay().toString();
    const hourKey = now.getHours().toString();
    const title = `⏰ Ranking da Hora Atual (${daysOfWeek[todayKey]}, ${hourKey}h)`;
    return formatRankingReply(title, statsSummary, groupId, todayKey, hourKey);
  }

  if (daysOfWeek[arg1]) {
    const dayKey = daysOfWeek[arg1];
    const dayName = daysOfWeek[dayKey];
    if (arg2 && !isNaN(arg2) && arg2 >= 0 && arg2 < 24) {
      const title = `🗓️ Ranking de ${dayName}, ${arg2}h`;
      return formatRankingReply(title, statsSummary, groupId, dayKey, arg2);
    } else {
      const title = `🗓️ Ranking de ${dayName} (Todas as Horas)`;
      return formatRankingReply(title, statsSummary, groupId, dayKey);
    }
  }

  if (!isNaN(arg1) && arg1 >= 0 && arg1 < 24) {
    const hourKey = parseInt(arg1, 10).toString();
    const title = `⏳ Ranking das ${hourKey}h (Geral)`;
    return formatRankingReply(title, statsSummary, groupId, null, hourKey);
  }

  return "❌ Filtro inválido. Use !help para ver os formatos.";
}
