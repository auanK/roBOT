export default {
  name: "help",
  description: "Mostra a lista de comandos disponíveis",
  usage: "!help",
  run: async ({ message }) => {
    const helpText = `
  📖 *Comandos disponíveis:*
  
  ❓ *!help* – Mostra esta mensagem de ajuda.
  🏓 *!ping* – Responde com "Pong!".
  🎲 *!roll <número de dados>(opcional)d<número de lados>* – Rola dados.
  👥 *!teams <número de pessoas por grupo> <nomes separados por vírgula>* – Cria grupos.
  ⏳ *!timer <número de segundos>* – Inicia um timer, ou !timer stop para cancelar.
  🔫 *!shot help - Comandos do minigame de roleta-russa.
  🃏 *!blackjack help - Comandos do minigame 21.
  🔤 *!wordle help - Comandos do minigame termo.
  🎰 *!rank* – Mostra o ranking de pontos e vitórias no grupo.
  🌦️ *!weather <cidade>,[país]* – Consulta o clima de uma cidade.
      `;
    await message.reply(helpText);
  },
};
