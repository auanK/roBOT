import { generateBarrel } from "./utils.js";
import { getRandomItem } from "./utils.js";

export function shoot(session, targetId) {
  const bullet = session.barrel[session.currentBarrelIndex++];
  const target = session.players.get(targetId);

  let fatal = false;
  let damageApplied = false;

  if (bullet === "live") {
    const shooterId = getCurrentPlayerId(session);
    const shooter = session.players.get(shooterId);
    const damage = shooter.doubleBarrelReady ? 2 : 1;

    target.lives -= damage;
    damageApplied = true;

    if (shooter.doubleBarrelReady) {
      shooter.doubleBarrelReady = false;
    }

    if (target.lives <= 0) {
      target.status = "dead";
      fatal = true;
    }
  }

  let reloaded = false;
  let live = 0;
  let blank = 0;

  if (session.currentBarrelIndex >= session.barrel.length) {
    session.barrel = generateBarrel();
    session.currentBarrelIndex = 0;
    reloaded = true;
    live = session.barrel.filter((b) => b === "live").length;
    blank = session.barrel.length - live;
  }

  const winnerId = checkWinner(session);

  return {
    bullet,
    fatal,
    damageApplied,
    reloaded,
    live,
    blank,
    gameOver: !!winnerId,
    winnerId,
  };
}

export function nextTurn(session) {
  let i = session.currentTurnIndex;
  for (let j = 0; j < session.turnOrder.length; j++) {
    i = (i + 1) % session.turnOrder.length;
    const playerId = session.turnOrder[i];
    const player = session.players.get(playerId);
    if (player.status === "alive") {
      session.currentTurnIndex = i;

      if (session.roundCount >= 1) {
        const item = getRandomItem();
        player.items.push(item);
      }

      session.roundCount++;
      return playerId;
    }
  }
}
export function getCurrentPlayerId(session) {
  return session.turnOrder[session.currentTurnIndex];
}

export function checkWinner(session) {
  const alive = [...session.players.entries()].filter(
    ([_, p]) => p.status === "alive"
  );
  return alive.length === 1 ? alive[0][0] : null;
}
