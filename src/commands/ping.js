// Comando clásico para verificar se o bot está online e funcionando.
export default {
  name: "ping",
  run: async ({ sock, message, chatId }) => {
    await sock.sendMessage(chatId, { text: "Pong!" }, { quoted: message });
  },
};
