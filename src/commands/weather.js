import { formatWeather } from "../utils/weatherUtils.js";

export default {
  name: "weather",
  description: "Consulta o clima de uma cidade",
  usage: "!weather <cidade> [país]",

  run: async ({message, args}) => {
    if (!args.length) {
      return await message.reply("❗ Exemplo de uso: *!weather Quixadá BR*");
    }

    const city = args.join(" ");
    const weatherLine = await formatWeather(city);

    const response =
      `📍 *Clima em ${city}*\n` +
      `🕒 ${new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}\n\n` +
      `${weatherLine}\n\nAtualizado via OpenWeather`;

    await message.reply(response);
  },
};
