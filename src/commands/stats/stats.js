import { isGroupMessage, getGroupAlias } from "../../utils/groupService.js";
import { loadMessageStats } from "../../utils/messageStatsService.js";
import { loadUsers } from "../../utils/userService.js";
import { handleStatsRequest } from "./handlers.js";

export default {
  name: "stats",
  description: "Mostra estatísticas de mensagens do grupo.",
  usage: "!stats [week|hours|today|now|dia|hora]",

  run: async ({ message, args }) => {
    if (!(await isGroupMessage(message))) return;

    const chat = await message.getChat();
    const groupId = await getGroupAlias(chat.id._serialized);

    const allStats = await loadMessageStats();
    const users = await loadUsers();
    const groupStats = allStats[groupId];

    if (!groupStats) {
      return message.reply(
        "📊 Nenhuma estatística registrada para este grupo ainda."
      );
    }

    const replyMessage = handleStatsRequest(args, groupStats, users);

    await message.reply(replyMessage.trim());
  },
};
