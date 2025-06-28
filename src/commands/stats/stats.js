import * as db from "../../database/database.js";
import { getGroupAlias } from "../../services/groupService.js";
import { handleStatsRequest } from "./handlers.js";

export default {
  name: "stats",
  description: "Mostra estatísticas de mensagens do grupo.",
  usage: "!stats [week|hours|today|now|dia|hora]",

  run: async ({ sock, message, args }) => {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith("@g.us")) return;

    const groupId = await getGroupAlias(chatId);

    const statsSummary = await db.messageLogs.getSummaryByGroup(groupId);

    if (!statsSummary || statsSummary.length === 0) {
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

    const replyMessage = await handleStatsRequest(args, statsSummary, groupId);

    await sock.sendMessage(chatId, { text: replyMessage }, { quoted: message });
  },
};
