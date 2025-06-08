import fetch from "node-fetch";

export default {
  name: "nasa",
  description: "Mostra a imagem do dia da NASA",
  usage: "!nasa",

  run: async ({ sock, message }) => {
    const chatId = message.key.remoteJid;
    const NASA_API_KEY = process.env.NASA_API_KEY;
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data || data.media_type !== "image") {
        return await sock.sendMessage(chatId, {
          text: "A imagem do dia não está disponível ou não é uma imagem.",
        }, { quoted: message });
      }

      const caption = `*${data.title}*\n\n${data.explanation}\n\nData: ${
        data.date
      }\nCrédito: ${data.copyright || "Desconhecido"}`;

      await sock.sendMessage(chatId, {
        image: { url: data.url },
        caption: caption,
      }, { quoted: message });
    } catch (error) {
      console.error("Erro ao buscar imagem da NASA:", error);
      await sock.sendMessage(chatId, {
        text: "Houve um erro ao obter a imagem do dia da NASA.",
      }, { quoted: message });
    }
  },
};
