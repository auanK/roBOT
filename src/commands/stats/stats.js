import { getGroupAlias } from "../../utils/groupService.js";
import { loadMessageStats } from "../../utils/messageStatsService.js";
import { loadUsers } from "../../utils/userService.js";
import { handleStatsRequest } from "./handlers.js";

export default {
  name: "stats",
  description: "Mostra estatísticas de mensagens do grupo.",
  usage: "!stats [week|hours|today|now|dia|hora]",

  run: async ({ sock, message, args }) => {
    const chatId = message.key.remoteJid;

    if (!chatId.endsWith("@g.us")) return;

    const groupId = await getGroupAlias(chatId);

    const allStats = await loadMessageStats();
    const groupStats = allStats[groupId];

    if (!groupStats) {
      return sock.sendMessage(
        chatId,
        {
          text: "📊 Nenhuma estatística registrada para este grupo ainda.",
        },
        {
          quoted: message,
        }
      );
    }

    const replyMessage = await handleStatsRequest(args, groupStats, groupId);

    await sock.sendMessage(chatId, { text: replyMessage }, { quoted: message });
  },
};
