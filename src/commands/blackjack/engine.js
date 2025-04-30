import { calculateTotal } from "./utils.js";

export function isGameOver(session) {
  return [...session.players.values()].every(
    (p) => p.status === "busted" || p.status === "stood"
  );
}

export function dealerPlay(session) {
  const dealer = session.dealer;
  while (dealer.total < 17) {
    const card = session.deck.shift();
    dealer.hand.push(card);
    dealer.total = calculateTotal(dealer.hand);
  }
  dealer.status = dealer.total > 21 ? "busted" : "stood";
}

export function getWinners(session) {
  const dealerTotal = session.dealer.total;
  return [...session.players.entries()]
    .filter(([_, p]) => p.total <= 21)
    .filter(([_, p]) => dealerTotal > 21 || p.total > dealerTotal);
}
