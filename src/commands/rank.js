import { loadStats } from "../utils/statsService.js";
import { loadUsers, getUserName } from "../utils/userService.js";
import { getGroupAlias } from "../utils/groupService.js";

export default {
  name: "rank",
  description: "Mostra o ranking de pontos e vitórias no grupo.",
  usage: "!rank",

  run: async ({ sock, message }) => {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith("@g.us")) return;

    const groupId = await getGroupAlias(chatId);
    const gameStats = await loadStats();
    const users = await loadUsers();
    const groupStats = gameStats[groupId];

    if (!groupStats || Object.keys(groupStats).length === 0) {
      return sock.sendMessage(
        chatId,
        {
          text: "📭 Nenhum jogador pontuou ainda neste grupo.",
        },
        { quoted: message }
      );
    }

    const players = await Promise.all(
      Object.entries(groupStats).map(async ([userId, games]) => {
        let totalPoints = 0;
        let totalWins = 0;
        const gameWins = {};

        for (const [game, data] of Object.entries(games)) {
          totalPoints += data.points || 0;
          totalWins += data.wins || 0;
          gameWins[game] = data.wins || 0;
        }

        const name = await getUserName(userId, groupId);

        return {
          id: userId,
          name,
          points: totalPoints,
          wins: totalWins,
          perGame: gameWins,
        };
      })
    );

    const topPoints = [...players]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
    let pointsRank = "🏅 *Ranking de Pontos:*\n";
    topPoints.forEach((p, i) => {
      const medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ` ${i + 1}.`;
      pointsRank += `${medal} ${p.name} – ${p.points} pts\n`;
    });

    const topWins = [...players].sort((a, b) => b.wins - a.wins).slice(0, 10);
    let winRank = "\n🏆 *Ranking de Vitórias:*\n";
    topWins.forEach((p, i) => {
      const medal =
        i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ` ${i + 1}.`;
      const perGameText = Object.entries(p.perGame)
        .map(([game, wins]) => `${game}: ${wins}`)
        .join(" | ");
      winRank += `${medal} ${p.name} – ${p.wins} (${perGameText})\n`;
    });

    await sock.sendMessage(
      chatId,
      { text: pointsRank + winRank },
      { quoted: message }
    );
  },
};
