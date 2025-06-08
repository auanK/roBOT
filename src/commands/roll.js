export default {
  name: "roll",
  description: "Rola um ou mais dados. Ex: !roll d6, !roll 2d20",
  usage: "!roll <quantidade>d<lados>",

  run: async ({ sock, message, args }) => {
    const chatId = message.key.remoteJid;
    const input = args[0]?.toLowerCase();

    // Expressão regular para capturar o formato correto (ex: d6, 2d10)
    const match = input?.match(/^(\d*)d(\d+)$/);

    const MAX_SIDES = 10000;
    const MAX_ROLLS = 1000;
    const MAX_DISPLAY = 100;

    // Se não estiver no formato esperado, retorna erro
    if (!match) {
      return sock.sendMessage(chatId, {
        text: "❌ Formato inválido. Use: !roll <n>d<lados> (ex: 2d6, d20)",
      }, { quoted: message });
    }

    // Extrai a quantidade de rolagens e lados
    const rolls = parseInt(match[1] || "1", 10);
    const sides = parseInt(match[2], 10);

    // Valida os limites das rolagens e dos lados
    if (
      isNaN(sides) ||
      isNaN(rolls) ||
      sides < 1 ||
      rolls < 1 ||
      sides > MAX_SIDES ||
      rolls > MAX_ROLLS
    ) {
      return sock.sendMessage(
        chatId,
        {
          text: `❌ Limites: até ${MAX_ROLLS} rolagens e ${MAX_SIDES} lados.`,
        },
        { quoted: message }
      );
    }

    // Gera os resultados das rolagens
    const results = Array.from({ length: rolls }, () => Math.floor(Math.random() * sides) + 1);

    // Caso só tenha uma rolagem, exibe direto
    if (rolls === 1) {
      return sock.sendMessage(
        chatId,
        { text: `🎲 Resultado: ${results[0]}` },
        { quoted: message }
      );
    }

    // Para múltiplas rolagens, mostra a soma e os primeiros resultados
    const sum = results.reduce((acc, val) => acc + val, 0);
    const displayed = results.slice(0, MAX_DISPLAY).join(", ");
    const suffix = results.length > MAX_DISPLAY ? ", ..." : "";

    return sock.sendMessage(
      chatId,
      { text: `🎲 Soma: ${sum} = [${displayed}${suffix}]` },
      { quoted: message }
    );
  },
};
