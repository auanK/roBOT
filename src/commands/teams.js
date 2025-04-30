export default {
  name: "teams",
  description: "Cria grupos aleatórios com os nomes fornecidos.",
  usage: "!teams <pessoas por grupo> <nomes separados por vírgula>",

  run: async ({message, args}) => {
    const groupSize = parseInt(args[0], 10);
    const MIN_NAMES = 2;
    const MAX_PER_GROUP = 10;

    // Valida o tamanho do grupo
    if (isNaN(groupSize) || groupSize < 1 || groupSize > MAX_PER_GROUP) {
      return message.reply(
        `❌ Formato inválido. Use: !teams <1-${MAX_PER_GROUP}> <nomes>`
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
      return message.reply("❌ Você precisa fornecer pelo menos 2 nomes.");
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

    await message.reply(reply);
  },
};
