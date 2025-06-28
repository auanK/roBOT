import * as db from "../database/database.js";
import { getUserName } from "../services/userService.js";
import { getGroupAlias } from "../services/groupService.js";

export default {
  name: "rank",
  description: "Mostra o ranking de pontos e vitórias no grupo.",
  usage: "!rank",

  run: async ({ sock, message }) => {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith("@g.us")) return;

    const groupId = await getGroupAlias(chatId);

    const groupStatsSummary = await db.gameStats.getSummaryByGroup(groupId);

    if (!groupStatsSummary || groupStatsSummary.length === 0) {
      return sock.sendMessage(
        chatId,
        {
          text: "📭 Nenhum jogador pontuou ainda neste grupo.",
        },
        { quoted: message }
      );
    }

    const players = await Promise.all(
      groupStatsSummary.map(async (playerStats) => ({
        id: playerStats.userId,
        name: await getUserName(playerStats.userId, groupId),
        totalPoints: playerStats.totalPoints,
        totalWins: playerStats.totalWins,
      }))
    );

    const topPoints = [...players]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    let pointsRank = "🏅 *Ranking de Pontos:*\n";
    topPoints.forEach((p, i) => {
      const medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ` ${i + 1}.`;
      pointsRank += `${medal} ${p.name} – ${p.totalPoints} pts\n`;
    });

    const topWins = [...players]
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, 10);

    let winRank = "\n🏆 *Ranking de Vitórias:*\n";
    topWins.forEach((p, i) => {
      const medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ` ${i + 1}.`;
      winRank += `${medal} ${p.name} – ${p.totalWins} vitórias\n`;
    });

    await sock.sendMessage(
      chatId,
      { text: pointsRank + winRank },
      { quoted: message }
    );
  },
};
