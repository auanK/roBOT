import { handleSet, handleDisplay } from "./handlers.js";

export default {
  name: "profile",
  description: "Gerencia e exibe seu perfil no grupo.",
  usage: "!profile [display|set] [name|desc] [texto]",

  run: async ({ sock, message, args, chatId, senderId }) => {
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        {
          text: "Este comando só pode ser usado em grupos.",
        },
        { quoted: message }
      );
    }

    const subCommand = args[0]?.toLowerCase();

    const handlerParams = { sock, message, args, chatId, senderId };

    if (subCommand === "set") {
      return await handleSet(handlerParams);
    } else {
      return await handleDisplay(handlerParams);
    }
  },
};
