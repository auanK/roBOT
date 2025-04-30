// Guarda os timers ativos por usuário
const activeTimers = new Map();

export default {
  name: "timer",
  description: "Inicia ou cancela um timer pessoal.",
  usage: "!timer <segundos> | !timer stop",

  run: async ({ message, args }) => {
    const userId = message.author.id;
    const MAX_TIME = 3600;

    // Se nenhum argumento for passado, avisa o usuário
    if (!args.length) {
      return message.reply(
        "❌ Você precisa fornecer um tempo ou usar '!timer stop'."
      );
    }

    // Cancela o timer ativo, se houver
    if (args[0] === "stop") {
      const timerData = activeTimers.get(userId);

      // Se não houver timer ativo, avisa o usuário
      if (!timerData) {
        return message.reply("❌ Você não tem um timer ativo.");
      }

      // Calcula o tempo restante e cancela o timer
      const remainingSeconds = Math.max(0, Math.floor((timerData.endTime - Date.now()) / 1000));
      clearTimeout(timerData.timeout);
      activeTimers.delete(userId);

      return message.reply(`⛔ Timer cancelado. Tempo restante: ${remainingSeconds}s.`);
    }

    // Converte o argumento para número inteiro
    const timeInSeconds = parseInt(args[0], 10);

    // Valida se o tempo fornecido é válido
    if (
      isNaN(timeInSeconds) ||
      timeInSeconds <= 0 ||
      timeInSeconds > MAX_TIME
    ) {
      return message.reply(
        `❌ Tempo inválido. Use um número entre 1 e ${MAX_TIME} segundos.`
      );
    }

    // Impede que o usuário tenha múltiplos timers
    if (activeTimers.has(userId)) {
      return message.reply("❌ Você já tem um timer ativo. Use '!timer stop' para cancelar.");
    }

    // Inicia o timer
    await message.reply(`⏳ Timer iniciado para ${timeInSeconds} segundos.`);

    const endTime = Date.now() + timeInSeconds * 1000;

    const timeout = setTimeout(async () => {
      try {
        // Tenta responder no mesmo chat
        await message.reply(`⏰ O timer de ${timeInSeconds} segundos acabou!`);
      } catch (err) {
        // Caso falhe (mensagem excluída, etc), tenta enviar no chat diretamente
        console.warn("Erro ao usar reply, tentando sendMessage:", err.message);
        const chat = await message.getChat();
        await chat.sendMessage(`⏰ O timer de ${timeInSeconds} segundos acabou!`);
      }

      // Remove o timer do mapa
      activeTimers.delete(userId);
    }, timeInSeconds * 1000);

    // Salva os dados do timer
    activeTimers.set(userId, { timeout, endTime });
  },
};
