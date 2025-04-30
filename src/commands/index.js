import help from "./help.js";
import ping from "./ping.js";
import roll from "./roll.js";
import teams from "./teams.js";
import timer from "./timer.js";
import rian from "./rian.js";
import shot from "./shot/shot.js";
import blackjack from "./blackjack/blackjack.js";
import wordle from "./wordle/wordle.js";
import rank from "./rank.js";
import weather from "./weather.js";
import nasa from "./nasa.js";

// Agrupa todos os comandos em um objeto e exporta
const commands = {
  help,
  ping,
  roll,
  teams,
  timer,
  rian,
  shot,
  blackjack,
  wordle,
  rank,
  weather,
  nasa,
};

export default commands;
