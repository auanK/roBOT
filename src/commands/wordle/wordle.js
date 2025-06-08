import {
  handleStart,
  handleGuess,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

export default {
  name: "wordle",
  description: "Jogo de adivinhação de palavra de 5 letras.",
  usage: "!wordle start | <palpite> | status | reset",

  run: async ({ sock, message, args, chatId, senderId }) => {
    if (!chatId.endsWith("@g.us")) return;

    const command = args[0]?.toLowerCase();

    const handlerParams = { sock, message, args, chatId, senderId };

    if (["start", "status", "reset", "help"].includes(command)) {
      switch (command) {
        case "start":
          return await handleStart(handlerParams);
        case "status":
          return await handleStatus(handlerParams);
        case "reset":
          return await handleReset(handlerParams);
        case "help":
        default:
          return await sendHelp(handlerParams);
      }
    }

    return await handleGuess(handlerParams);
  },
};
