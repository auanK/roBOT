import {
  getTodayDate,
  loadGameData,
  saveGameData,
  getValidWords,
  normalize,
} from "./utils.js";
import { getWordleSession, resetWordleSession } from "./session.js";
import { checkGuess, getFeedback } from "./engine.js";
import { addPoints } from "../../utils/statsService.js";
import {
  registerUser,
  getUserName,
  normalizeUserId,
} from "../../utils/userService.js";
import { getGroupAlias, registerGroup } from "../../utils/groupService.js";

// Inicia uma partida de Wordle
export async function handleStart({ sock, message, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getWordleSession(groupId);
  const today = getTodayDate();

  if (session.started) {
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Já existe um Wordle ativo neste grupo!" },
      { quoted: message }
    );
  }

  const data = await loadGameData();
  if (data[groupId]?.[today]) {
    return sock.sendMessage(
      chatId,
      { text: "🛑 O Wordle de hoje já foi iniciado neste grupo." },
      { quoted: message }
    );
  }

  const mentioned =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0 || mentioned.length > 3) {
    return sock.sendMessage(
      chatId,
      { text: "❗ Uso: *!wordle start @j1 @j2 ...* (máx. 3 jogadores)" },
      { quoted: message }
    );
  }

  const allPlayers = [senderId, ...mentioned].map((id) => normalizeUserId(id));
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
  const groupName =
    (await sock.groupMetadata(chatId))?.subject || "Grupo Desconhecido";
  await registerGroup(groupId, groupName);

  for (const id of allPlayers) {
    const nickname = await getUserName(id);
    await registerUser(id, nickname);
  }

  await sock.sendMessage(
    chatId,
    {
      text: `🧠 *Wordle iniciado!*\nJogadores: ${allPlayers.length} participantes.\n6 tentativas. Boa sorte!`,
    },
    { quoted: message }
  );
}

// Lida com um palpite do usuário
export async function handleGuess({ sock, message, args, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getWordleSession(groupId);
  const data = await loadGameData();
  const game = data[groupId]?.[session.date];

  if (!game || game.finished) {
    return sock.sendMessage(
      chatId,
      { text: "❌ Nenhum jogo ativo ou já finalizado." },
      { quoted: message }
    );
  }
  if (!game.participants.includes(senderId)) {
    return sock.sendMessage(
      chatId,
      { text: "❌ Você não está participando hoje." },
      { quoted: message }
    );
  }
  if (game.guesses.length >= 6) {
    return sock.sendMessage(
      chatId,
      { text: "🚫 Já foram feitas as 6 tentativas." },
      { quoted: message }
    );
  }

  const guess = args[0]?.toLowerCase();
  if (!guess || guess.length !== 5) {
    return sock.sendMessage(
      chatId,
      { text: "❗ Palavras precisam ter 5 letras." },
      { quoted: message }
    );
  }

  const validWords = await getValidWords();
  if (!validWords.includes(guess)) {
    return sock.sendMessage(
      chatId,
      { text: "❌ Palavra inválida." },
      { quoted: message }
    );
  }

  game.guesses.push(guess);

  const normalizedSecretWord = normalize(game.word);
  for (const letter of guess) {
    const normalizedLetter = normalize(letter);
    if (!normalizedSecretWord.includes(normalizedLetter)) {
      const baseLetter = normalizedLetter.toUpperCase();
      if (!game.invalidLetters.includes(baseLetter)) {
        game.invalidLetters.push(baseLetter);
      }
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
    }
    msg += `\n✅ Palavra correta: *${game.word}*\nTodos ganharam ${points} pontos!`;
    game.finished = true;
    resetWordleSession(groupId);
  } else if (game.guesses.length === 6) {
    for (const id of game.participants) {
      await addPoints(groupId, id, "wordle", 0, "loss");
    }
    msg += `\n❌ Fim do jogo. A palavra era: *${game.word}*`;
    game.finished = true;
    resetWordleSession(groupId);
  }

  if (game.invalidLetters.length) {
    const letras = [...new Set(game.invalidLetters)]
      .map((l) => l.toUpperCase())
      .sort()
      .join(", ");
    msg += `\n\n❌ Letras ausentes: ${letras}`;
  }

  await saveGameData(data);
  return sock.sendMessage(chatId, { text: msg }, { quoted: message });
}

// Funções de status, reset e ajuda adaptadas
export async function handleStatus({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getWordleSession(groupId);
  const data = await loadGameData();
  const game = data[groupId]?.[session.date];

  if (!game) {
    return sock.sendMessage(
      chatId,
      { text: "❌ Nenhum jogo ativo." },
      { quoted: message }
    );
  }

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
  return sock.sendMessage(chatId, { text: status }, { quoted: message });
}

export async function handleReset({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getWordleSession(groupId);
  const data = await loadGameData();

  if (data[groupId]?.[session.date]) {
    delete data[groupId][session.date];
    await saveGameData(data);
  }

  resetWordleSession(groupId);
  return sock.sendMessage(
    chatId,
    { text: "♻️ Wordle resetado." },
    { quoted: message }
  );
}

export async function sendHelp({ sock, message, chatId }) {
  const help = `📝 *Comandos do Wordle:*\n• \`!wordle start @j1 @j2 ...\`\n• \`!wordle <palpite>\`\n• \`!wordle status\`\n• \`!wordle reset\``;
  await sock.sendMessage(chatId, { text: help.trim() }, { quoted: message });
}
