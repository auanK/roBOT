export default {
  name: "teams",
  description: "Cria grupos aleatórios com os nomes fornecidos.",
  usage: "!teams <pessoas por grupo> <nomes separados por vírgula>",

  run: async ({ sock, message, args }) => {
    const chatId = message.key.remoteJid;
    const groupSize = parseInt(args[0], 10);
    const MIN_NAMES = 2;
    const MAX_PER_GROUP = 10;

    // Valida o tamanho do grupo
    if (isNaN(groupSize) || groupSize < 1 || groupSize > MAX_PER_GROUP) {
      return sock.sendMessage(
        chatId,
        {
          text: `❌ Formato inválido. Use: !teams <1-${MAX_PER_GROUP}> <nomes>`,
        },
        { quoted: message }
      );
    }

    // Junta os argumentos em uma string e separa os nomes por vírgula
    const namesText = args.slice(1).join(" ");
    const names = namesText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean); // Remove entradas vazias

    // Verifica se tem nomes suficientes
    if (names.length < MIN_NAMES) {
      return sock.sendMessage(
        chatId,
        {
          text: "❌ Você precisa fornecer pelo menos " + MIN_NAMES + " nomes.",
        },
        { quoted: message }
      );
    }

    // Embaralha a lista de nomes usando Fisher-Yates
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    // Cria os grupos com base no tamanho fornecido
    const groups = [];
    for (let i = 0; i < names.length; i += groupSize) {
      groups.push(names.slice(i, i + groupSize));
    }

    // Monta a resposta com os grupos criados
    let reply = "📋 Times gerados:\n";
    groups.forEach((group, index) => {
      reply += `Time ${index + 1}: ${group.join(", ")}\n`;
    });

    await sock.sendMessage(chatId, { text: reply }, { quoted: message });
  },
};
