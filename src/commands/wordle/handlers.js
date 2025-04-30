import {
  getTodayDate,
  loadGameData,
  saveGameData,
  getValidWords,
  extractMentionedIds,
} from "./utils.js";
import { getWordleSession, resetWordleSession } from "./session.js";
import { checkGuess, getFeedback } from "./engine.js";
import { addPoints } from "../../utils/statsService.js";
import { registerUser } from "../../utils/userService.js";
import { registerGroup } from "../../utils/groupService.js";

// Inicia uma partida de Wordle no grupo
export async function handleStart(message, playerId) {
  const chat = await message.getChat();
  const groupId = chat.id._serialized;
  const session = getWordleSession(groupId);
  const today = getTodayDate();

  if (session.started) {
    return await message.reply("⚠️ Já existe um Wordle ativo neste grupo!");
  }

  const data = await loadGameData();
  if (data[groupId]?.[today]) {
    return await message.reply("🛑 O Wordle de hoje já foi iniciado neste grupo.");
  }

  const mentioned = extractMentionedIds(message);
  if (!mentioned.length || mentioned.length > 3) {
    return await message.reply(
      "❗ Use: *!wordle start @j1 @j2 ...* (máx. 3 jogadores)"
    );
  }

  const allPlayers = [playerId, ...mentioned];
  const words = await getValidWords();
  const secretWord = words[Math.floor(Math.random() * words.length)];

  if (!data[groupId]) data[groupId] = {};
  
  data[groupId][today] = {
    word: secretWord,
    guesses: [],
    participants: allPlayers,
    invalidLetters: [],
    finished: false,
    scores: Object.fromEntries(allPlayers.map((id) => [id, 0])),
  };

  session.started = true;
  session.date = today;
  session.participants = allPlayers;

  await saveGameData(data);

  await registerGroup(groupId, chat.name);

  const mentions = await message.getMentions();
  const author = await message.getContact();

  for (const id of allPlayers) {
    const contact = id === playerId ? author : mentions.find((c) => c.id._serialized === id);
    const nickname = contact?.pushname || contact?.name || id;
    await registerUser(id, nickname);
  }

  await message.reply(
    `🧠 *Wordle iniciado!*\nJogadores: ${allPlayers.length} participantes.\n6 tentativas. Boa sorte!`
  );
}

export async function handleGuess(message, playerId) {
  const groupId = (await message.getChat()).id._serialized;
  const session = getWordleSession(groupId);
  const data = await loadGameData();
  const game = data[groupId]?.[session.date];

  if (!game || game.finished) {
    return await message.reply("❌ Nenhum jogo ativo ou já finalizado.");
  }

  if (!game.participants.includes(playerId)) {
    return await message.reply("❌ Você não está participando hoje.");
  }

  if (game.guesses.length >= 6) {
    return await message.reply("🚫 Já foram feitas as 6 tentativas.");
  }

  const guess = message.body.slice(8).trim().toLowerCase();
  if (guess.length !== 5) {
    return await message.reply("❗ Palavras precisam ter 5 letras.");
  }

  const validWords = await getValidWords();
  if (!validWords.includes(guess)) {
    return await message.reply("❌ Palavra inválida.");
  }

  game.guesses.push(guess);

  for (const letter of guess) {
    if (!game.word.includes(letter) && !game.invalidLetters.includes(letter)) {
      game.invalidLetters.push(letter);
    }
  }

  let msg = `📊 *Status (${game.guesses.length}/6):*\n`;
  for (const g of game.guesses) {
    msg += `${getFeedback(game.word, g)}  \`${g}\`\n`;
  }

  if (checkGuess(game.word, guess)) {
    const points = [0, 150, 120, 100, 80, 60, 40][game.guesses.length] || 40;
    for (const id of game.participants) {
      await addPoints(groupId, id, "wordle", points, "win");
      game.scores[id] = points;
    }

    msg += `\n✅ Palavra correta: *${game.word}*\nTodos ganharam ${points} pontos!`;
    game.finished = true;
    session.started = false;
  } else if (game.guesses.length === 6) {
    for (const id of game.participants) {
      await addPoints(groupId, id, "wordle", 0, "loss");
    }

    msg += `\n❌ Fim do jogo. A palavra era: *${game.word}*`;
    game.finished = true;
    session.started = false;
  }

  if (game.invalidLetters.length) {
    const letras = [...new Set(game.invalidLetters)]
      .map((l) => l.toUpperCase())
      .sort()
      .join(", ");
    msg += `\n\n❌ Letras ausentes: ${letras}`;
  }

  await saveGameData(data);
  return await message.reply(msg);
}

export async function handleStatus(message) {
  const groupId = (await message.getChat()).id._serialized;
  const session = getWordleSession(groupId);
  const data = await loadGameData();
  const game = data[groupId]?.[session.date];

  if (!game) return await message.reply("❌ Nenhum jogo ativo.");

  let status = `📊 *Status (${game.guesses.length}/6):*\n`;
  for (const g of game.guesses) {
    status += `${getFeedback(game.word, g)}  \`${g}\`\n`;
  }

  if (game.invalidLetters.length) {
    const letras = [...new Set(game.invalidLetters)]
      .map((l) => l.toUpperCase())
      .sort()
      .join(", ");
    status += `\n❌ Letras ausentes: ${letras}`;
  }

  return await message.reply(status);
}

export async function handleReset(message) {
  const groupId = (await message.getChat()).id._serialized;
  const session = getWordleSession(groupId);
  const data = await loadGameData();

  if (data[groupId]) {
    delete data[groupId][session.date];
    await saveGameData(data);
  }

  resetWordleSession(groupId);
  return await message.reply("♻️ Wordle resetado.");
}

export async function sendHelp(message) {
  const help = `
📝 *Comandos do Wordle:*
• \`!wordle start @j1 @j2 ...\`
• \`!wordle <palpite>\`
• \`!wordle status\`
• \`!wordle reset\`
`;
  await message.reply(help.trim());
}
