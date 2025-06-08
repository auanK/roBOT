import {
  handleStart,
  handleShoot,
  handleUseItem,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

export default {
  name: "shot",
  description: "Jogo da Roleta Russa entre até 4 jogadores.",
  usage: "!shot start @j1 @j2 ... | shoot @alvo | use | status | reset",

  run: async ({ sock, message, args, chatId, senderId }) => {
    if (!chatId.endsWith("@g.us")) return;

    const command = args[0]?.toLowerCase();

    const handlerParams = { sock, message, args, chatId, senderId };

    switch (command) {
      case "start":
        return await handleStart(handlerParams);
      case "shoot":
        return await handleShoot(handlerParams);
      case "use":
        return await handleUseItem(handlerParams);
      case "status":
        return await handleStatus(handlerParams);
      case "reset":
        return await handleReset(handlerParams);
      default:
        return await sendHelp(handlerParams);
    }
  },
};
