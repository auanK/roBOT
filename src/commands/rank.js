import { loadStats } from "../utils/statsService.js";
import { loadUsers } from "../utils/userService.js";
import { isGroupMessage } from "../utils/groupService.js";

export default {
  name: "rank",
  description: "Mostra o ranking de pontos e vitórias no grupo.",
  usage: "!rank",

  run: async ({message}) => {
    if (!(await isGroupMessage(message))) {
      return;
    }

    const chat = await message.getChat();
    const groupId = chat.id._serialized;

    const stats = await loadStats();
    const users = await loadUsers();
    const groupStats = stats[groupId];

    if (!groupStats || Object.keys(groupStats).length === 0) {
      return await message.reply("📭 Nenhum jogador pontuou ainda neste grupo.");
    }

    const players = Object.entries(groupStats).map(([userId, games]) => {
      let totalPoints = 0;
      let totalWins = 0;
      const gameWins = {};

      for (const [game, data] of Object.entries(games)) {
        totalPoints += data.points || 0;
        totalWins += data.wins || 0;
        gameWins[game] = data.wins || 0;
      }

      const userData = users[userId] || {};
      const name = userData.pushname || userData.name || userId;

      return {
        id: userId,
        name,
        points: totalPoints,
        wins: totalWins,
        perGame: gameWins,
      };
    });

    // Top 10 por pontos
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

    await message.reply(pointsRank + winRank);
  },
};
