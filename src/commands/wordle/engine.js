import { normalize } from "./utils.js";

export function checkGuess(secret, guess) {
  return normalize(secret) === normalize(guess);
}

export function getFeedback(secret, guess) {
  const result = [];
  const used = Array(5).fill(false);

  const normSecret = normalize(secret);
  const normGuess = normalize(guess);

  for (let i = 0; i < 5; i++) {
    if (normGuess[i] === normSecret[i]) {
      result[i] = "🟩";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    const index = normSecret
      .split("")
      .findIndex((l, j) => !used[j] && l === normGuess[i]);
    result[i] = index !== -1 ? "🟨" : "⬛";
    if (index !== -1) used[index] = true;
  }

  return result.join("");
}
