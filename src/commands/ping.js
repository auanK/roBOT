// Comando clásico para verificar se o bot está online e funcionando.
export default {
  name: "ping",
  run: async ({message}) => {
    await message.reply("Pong!");
  },
};
