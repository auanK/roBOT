export function createDeck() {
  const suits = ["♠️", "♥️", "♦️", "♣️"];
  const ranks = [
    { name: "A", value: 11 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "7", value: 7 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "J", value: 10 },
    { name: "Q", value: 10 },
    { name: "K", value: 10 },
  ];

  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ name: `${rank.name} ${suit}`, value: rank.value });
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function calculateTotal(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += card.value;
    if (card.name.startsWith("A")) aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

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
