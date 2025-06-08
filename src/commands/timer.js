// Guarda os timers ativos por usuário
const activeTimers = new Map();

export default {
  name: "timer",
  description: "Inicia ou cancela um timer pessoal.",
  usage: "!timer <segundos> | !timer stop",

  run: async ({ sock, message, args, senderId }) => {
    const chatId = message.key.remoteJid;
    const userId = senderId;
    const MAX_TIME = 3600;

    // Se nenhum argumento for passado, avisa o usuário
    if (!args.length) {
      return sock.sendMessage(
        chatId,
        {
          text: "❌ Você precisa fornecer um tempo ou usar '!timer stop'.",
        },
        { quoted: message }
      );
    }

    // Cancela o timer ativo, se houver
    if (args[0] === "stop") {
      const timerData = activeTimers.get(userId);

      // Se não houver timer ativo, avisa o usuário
      if (!timerData) {
        return sock.sendMessage(
          chatId,
          {
            text: "❌ Você não tem um timer ativo.",
          },
          { quoted: message }
        );
      }

      // Calcula o tempo restante e cancela o timer
      const remainingSeconds = Math.max(
        0,
        Math.floor((timerData.endTime - Date.now()) / 1000)
      );
      clearTimeout(timerData.timeout);
      activeTimers.delete(userId);

      return sock.sendMessage(
        chatId,
        {
          text: `⛔ Timer cancelado. Tempo restante: ${remainingSeconds}s.`,
        },
        { quoted: message }
      );
    }

    // Converte o argumento para número inteiro
    const timeInSeconds = parseInt(args[0], 10);

    // Valida se o tempo fornecido é válido
    if (
      isNaN(timeInSeconds) ||
      timeInSeconds <= 0 ||
      timeInSeconds > MAX_TIME
    ) {
      return sock.sendMessage(
        chatId,
        {
          text: `❌ Tempo inválido. Use um número entre 1 e ${MAX_TIME} segundos.`,
        },
        { quoted: message }
      );
    }

    // Impede que o usuário tenha múltiplos timers
    if (activeTimers.has(userId)) {
      return sock.sendMessage(
        chatId,
        {
          text: "❌ Você já tem um timer ativo. Use '!timer stop' para cancelar.",
        },
        { quoted: message }
      );
    }

    // Inicia o timer
    await sock.sendMessage(
      chatId,
      {
        text: `⏳ Timer iniciado para ${timeInSeconds} segundos.`,
      },
      { quoted: message }
    );

    const endTime = Date.now() + timeInSeconds * 1000;

    const timeout = setTimeout(async () => {
      await sock.sendMessage(chatId, {
        text: `⏰ O timer de ${timeInSeconds} segundos acabou!`,
      }, { quoted: message });
      // Remove o timer do mapa
      activeTimers.delete(userId);
    }, timeInSeconds * 1000);

    // Salva os dados do timer
    activeTimers.set(userId, { timeout, endTime });
  },
};
