import {
  handleStart,
  handleDraw,
  handleStand,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

import { isGroupMessage } from "../../utils/groupService.js";

export default {
  name: "blackjack",
  description: "Jogo de Blackjack com múltiplos jogadores.",
  usage: "!blackjack start @j1 @j2 ... | draw | stand | status | reset",

  run: async ({message, args}) => {
    if (!(await isGroupMessage(message))) {
      return;
    }

    const command = args[0]?.toLowerCase();
    const playerId = message.author || message.from;

    switch (command) {
      case "start":
        return await handleStart(message, playerId);
      case "draw":
        return await handleDraw(message, playerId);
      case "stand":
        return await handleStand(message, playerId);
      case "status":
        return await handleStatus(message);
      case "reset":
        return await handleReset(message);
      default:
        return await sendHelp(message);
    }
  },
};
