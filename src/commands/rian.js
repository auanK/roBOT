// ...
export default {
  name: "rian",
  run: async ({ sock, message, chatId }) => {
    await sock.sendMessage(chatId, { text: "👨‍🌾" }, { quoted: message });
  },
};
