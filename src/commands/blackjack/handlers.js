import { getBlackjackSession, resetBlackjackSession } from "./session.js";
import { createDeck, calculateTotal } from "./utils.js";
import { dealerPlay, getWinners, isGameOver } from "./engine.js";
import { addPoints } from "../../utils/statsService.js";
import {
  registerUser,
  getUserName,
  normalizeUserId,
} from "../../utils/userService.js";
import { getGroupAlias, registerGroup } from "../../utils/groupService.js";

export async function handleStart({ sock, message, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getBlackjackSession(groupId);

  if (session.started) {
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Já existe uma partida de Blackjack em andamento!" },
      { quoted: message }
    );
  }

  const mentioned =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  if (mentioned.length > 3) {
    return sock.sendMessage(
      chatId,
      { text: "❗ Máximo de 4 jogadores por rodada." },
      { quoted: message }
    );
  }

  const newSession = resetBlackjackSession(groupId);
  newSession.started = true;
  newSession.deck = createDeck();

  const allPlayerIds = [senderId, ...mentioned].map((id) =>
    normalizeUserId(id)
  );

  const groupName =
    (await sock.groupMetadata(chatId))?.subject || "Grupo Desconhecido";
  await registerGroup(groupId, groupName);

  for (const id of allPlayerIds) {
    const nickname = await getUserName(id, sock); // Usa a nova função para todos
    await registerUser(id, nickname);

    const hand = [newSession.deck.shift(), newSession.deck.shift()];
    const total = calculateTotal(hand);

    newSession.players.set(id, { nickname, total, status: "playing", hand });
    const handText = hand.map((c) => c.name).join(", ");
    await sock.sendMessage(id, {
      text: `🃏 Suas cartas no Blackjack: ${handText}\nTotal: ${total}`,
    });
  }

  const dealerHand = [newSession.deck.shift(), newSession.deck.shift()];
  newSession.dealer = {
    hand: dealerHand,
    total: calculateTotal(dealerHand),
    status: "waiting",
  };

  const visibleCard = dealerHand[0].name;
  await sock.sendMessage(chatId, {
    text: `🧑‍⚖️ Dealer está na mesa.\n• Carta visível: ${visibleCard}\n• Outra carta está virada.`,
  });

  const playerList = [...newSession.players.values()]
    .map((p) => p.nickname)
    .join(", ");
  return sock.sendMessage(chatId, {
    text: `🃏 Jogo iniciado!\nJogadores: ${playerList}`,
  });
}

export async function handleDraw({ sock, message, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getBlackjackSession(groupId);

  if (!session.started)
    return sock.sendMessage(
      chatId,
      { text: "⛔ Jogo não iniciado." },
      { quoted: message }
    );
  if (!session.players.has(senderId))
    return sock.sendMessage(
      chatId,
      { text: "❌ Você não está no jogo." },
      { quoted: message }
    );

  const player = session.players.get(senderId);
  if (player.status !== "playing")
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Você já parou ou estourou." },
      { quoted: message }
    );

  const card = session.deck.shift();
  player.hand.push(card);
  player.total = calculateTotal(player.hand);

  let privateMsg = `🃏 Você puxou: ${card.name}\nTotal: ${player.total}`;
  if (player.total > 21) {
    player.status = "busted";
    privateMsg += `\n💥 Você estourou!`;
    await sock.sendMessage(chatId, {
      text: `💥 ${player.nickname} estourou com ${player.total} pontos.`,
    });
  }
  await sock.sendMessage(senderId, { text: privateMsg });

  if (isGameOver(session)) await sendResults({ sock, chatId, session });
}

export async function handleStand({ sock, message, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getBlackjackSession(groupId);
  const player = session.players.get(senderId);

  if (!player || player.status !== "playing") {
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Você já parou ou não está jogando." },
      { quoted: message }
    );
  }

  player.status = "stood";
  await sock.sendMessage(
    chatId,
    { text: `✋ ${player.nickname} parou.` },
    { quoted: message }
  );

  if (isGameOver(session)) await sendResults({ sock, chatId, session });
}

async function sendResults({ sock, chatId, session }) {
  const groupId = await getGroupAlias(chatId);

  dealerPlay(session);
  const winners = getWinners(session);
  const dealerText = session.dealer.hand.map((c) => c.name).join(", ");

  let result = `🎲 *Resultado da Rodada*\n\n`;
  result += `🧑‍⚖️ *Dealer* — ${session.dealer.total} (${session.dealer.status})\n${dealerText}\n\n`;
  result += `👥 *Jogadores*\n`;

  for (const [id, player] of session.players.entries()) {
    const handText = player.hand.map((c) => c.name).join(", ");
    result += `• ${player.nickname} — ${player.total} (${player.status})\n${handText}\n`;
  }

  if (winners.length > 0) {
    result += `\n🏆 *Vencedores:*\n`;
    for (const [id, player] of winners) {
      await addPoints(groupId, id, "blackjack", 50, "win");
      result += `• ${player.nickname} (${player.total})\n`;
    }
  } else {
    result += `\n😬 Ninguém venceu o dealer.`;
  }

  for (const [id] of session.players.entries()) {
    if (!winners.some(([wid]) => wid === id)) {
      await addPoints(groupId, id, "blackjack", 0, "loss");
    }
  }

  resetBlackjackSession(groupId);
  sock.sendMessage(chatId, { text: result.trim() });
}

export async function handleStatus({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getBlackjackSession(groupId);
  if (!session.started)
    return sock.sendMessage(
      chatId,
      { text: "📴 Nenhum jogo em andamento." },
      { quoted: message }
    );

  let status = "📋 *Status do jogo:*\n";
  for (const [, player] of session.players.entries()) {
    status += `- ${player.nickname} (${player.status})\n`;
  }
  status += `\n🧑‍⚖️ Dealer mostrou: ${session.dealer.hand[0].name}`;
  await sock.sendMessage(chatId, { text: status }, { quoted: message });
}

export async function handleReset({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  resetBlackjackSession(groupId);
  return sock.sendMessage(
    chatId,
    { text: "♻️ Blackjack reiniciado." },
    { quoted: message }
  );
}

export async function sendHelp({ sock, message, chatId }) {
  const helpText = `📝 *Comandos do Blackjack:*\n• \`!blackjack start @j1 @j2 @j3\`\n• \`!blackjack draw\`\n• \`!blackjack stand\`\n• \`!blackjack status\`\n• \`!blackjack reset\``;
  return sock.sendMessage(
    chatId,
    { text: helpText.trim() },
    { quoted: message }
  );
}
