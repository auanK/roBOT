import {
  handleStart,
  handleGuess,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

import { isGroupMessage } from "../../utils/groupService.js";

export default {
  name: "wordle",
  description: "Jogo de adivinhação de palavra de 5 letras.",
  usage: "!wordle start | <palpite> | status | reset",

  run: async ({ message, args }) => {
    if (!(await isGroupMessage(message))) {
      return;
    }

    const command = args[0]?.toLowerCase();
    const playerId = message.author || message.from;

    if (["start", "status", "reset", "help"].includes(command)) {
      switch (command) {
        case "start":
          return await handleStart(message, playerId);
        case "status":
          return await handleStatus(message);
        case "reset":
          return await handleReset(message);
        case "help":
          return await sendHelp(message);
        default:
          return await sendHelp(message);
      }
    }

    return await handleGuess(message, playerId);
  },
};
