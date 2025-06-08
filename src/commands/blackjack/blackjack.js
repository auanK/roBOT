import {
  handleStart,
  handleDraw,
  handleStand,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

export default {
  name: "blackjack",
  description: "Jogo de Blackjack com múltiplos jogadores.",
  usage: "!blackjack start @j1 @j2 ... | draw | stand | status | reset",

  run: async ({ sock, message, args, chatId, senderId }) => {
    if (!chatId.endsWith("@g.us")) return;

    const command = args[0]?.toLowerCase();

    const handlerParams = { sock, message, args, chatId, senderId };

    switch (command) {
      case "start":
        return await handleStart(handlerParams);
      case "draw":
        return await handleDraw(handlerParams);
      case "stand":
        return await handleStand(handlerParams);
      case "status":
        return await handleStatus(handlerParams);
      case "reset":
        return await handleReset(handlerParams);
      default:
        return await sendHelp(handlerParams);
    }
  },
};
