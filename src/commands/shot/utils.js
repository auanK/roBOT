// Gera o tambor com 6 balas, com chance maior para 3 ou 4 balas cheias
export function generateBarrel() {
  const possibleLiveCounts = [1, 2, 3, 4, 5];
  const weights = [1, 2, 3, 3, 1];

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  let live = 1;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      live = possibleLiveCounts[i];
      break;
    }
  }

  if (live >= 6) live = 5;
  const blanks = 6 - live;

  const barrel = Array(live).fill("live").concat(Array(blanks).fill("blank"));

  for (let i = barrel.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [barrel[i], barrel[j]] = [barrel[j], barrel[i]];
  }
  return barrel;
}

// Pega o ID do jogador que enviou a mensagem
export function getSenderId(message) {
  return message.author || message.from;
}

// Pega o ID dos jogadores que estão sendo mencionados na mensagem
export function extractMentionedIds(message) {
  let mentioned = message.mentionedIds || [];
  if (!mentioned.length) {
    const matches = message.body.match(/@(\d{5,})/g);
    if (matches) {
      mentioned = matches.map((m) => m.replace("@", "") + "@c.us");
    }
  }
  return mentioned;
}

// Forma a mensagem de status de vidas dos jogadores
export function formatLivesStatus(playersMap, totalLives) {
  return Array.from(playersMap.entries()).map(([_, player]) => {
    const { nickname, lives } = player;
    const hearts = "❤️".repeat(lives);
    const skulls = "☠️".repeat(Math.max(0, totalLives - lives));
    return `• ${nickname}: ${hearts}${skulls}`;
  }).join("\n");
}