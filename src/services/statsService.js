import * as db from "../database/database.js";

export async function addPoints(
  groupId,
  userId,
  game,
  points = 0,
  result = "win"
) {
  const gameResult = {
    userId,
    groupId,
    game,
    result,
    pointsEarned: points,
  };

  db.gameStats.add(gameResult);
}
