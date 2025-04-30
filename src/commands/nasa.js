import fetch from "node-fetch";
import pkg from "whatsapp-web.js";

const { MessageMedia } = pkg;

export default {
  name: "nasa",
  description: "Mostra a imagem do dia da NASA",
  usage: "!nasa",

  run: async ({ message, client }) => {
    const NASA_API_KEY = process.env.NASA_API_KEY;
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.media_type !== "image") {
        return await message.reply("A imagem do dia não está disponível ou não é uma imagem.");
      }

      // Baixa a imagem
      const imageResponse = await fetch(data.url);
      const buffer = await imageResponse.buffer();

      // Cria o objeto de mídia com base64
      const media = new MessageMedia("image/jpeg", buffer.toString("base64"), "nasa.jpg");

      // Envia a imagem primeiro
      await client.sendMessage(message.from, media);

      // Depois envia o texto
      const caption = `*${data.title}*\n\n${data.explanation}\n\nData: ${data.date}\nCrédito: ${data.copyright || "Desconhecido"}`;
      await client.sendMessage(message.from, caption);

    } catch (error) {
      console.error("Erro ao buscar imagem da NASA:", error);
      await message.reply("Houve um erro ao obter a imagem do dia da NASA.");
    }
  },
};