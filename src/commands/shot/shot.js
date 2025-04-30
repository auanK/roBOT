import {
  handleStart,
  handleShoot,
  handleStatus,
  handleReset,
  sendHelp,
} from "./handlers.js";

import { isGroupMessage } from "../../utils/groupService.js";

export default {
  name: "shot",
  description: "Jogo da Roleta Russa entre até 4 jogadores.",
  usage:
    "!shot start @j1 @j2 ... | shoot @alvo | status | reset",

  run: async ({message, args}) => {
    if (!(await isGroupMessage(message))) {
      return;
    }

    const command = args[0]?.toLowerCase();
    const playerId = message.author || message.from;

    switch (command) {
      case "start":
        return await handleStart(message, playerId, args);
      case "shoot":
        return await handleShoot(message, playerId, args);
      case "status":
        return await handleStatus(message);
      case "reset":
        return await handleReset(message);
      default:
        return await sendHelp(message);
    }
  },
};
