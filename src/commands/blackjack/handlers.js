import { getBlackjackSession, resetBlackjackSession } from "./session.js";
import { createDeck, calculateTotal, extractMentionedIds } from "./utils.js";
import { dealerPlay, getWinners, isGameOver } from "./engine.js";
import { addPoints } from "../../utils/statsService.js";
import { registerUser } from "../../utils/userService.js";
import { registerGroup } from "../../utils/groupService.js";

export async function handleStart(message, playerId) {
  const chat = await message.getChat();
  const groupId = chat.id._serialized;
  const session = getBlackjackSession(groupId);

  if (session.started) {
    return await message.reply(
      "⚠️ Já existe uma partida de Blackjack em andamento!"
    );
  }

  const mentioned = extractMentionedIds(message);
  if (mentioned.length > 3) {
    return await message.reply("❗ Máximo de 4 jogadores por rodada.");
  }

  const newSession = resetBlackjackSession(groupId);
  newSession.started = true;
  newSession.deck = createDeck();

  const allPlayers = [playerId, ...mentioned];
  const mentions = await message.getMentions();
  const author = await message.getContact();

  await registerGroup(groupId, chat.name);

  for (const id of allPlayers) {
    const contact =
      id === playerId ? author : mentions.find((c) => c.id._serialized === id);
    const nickname = contact?.pushname || contact?.name || id;

    const hand = [newSession.deck.shift(), newSession.deck.shift()];
    const total = calculateTotal(hand);

    newSession.players.set(id, { nickname, total, status: "playing", hand });

    const handText = hand.map((c) => c.name).join(", ");
    await message.client.sendMessage(id, `🃏 Suas cartas: ${handText}\nTotal: ${total}`);


    await registerUser(id, nickname);
  }

  const dealerHand = [newSession.deck.shift(), newSession.deck.shift()];
  newSession.dealer = {
    hand: dealerHand,
    total: calculateTotal(dealerHand),
    status: "waiting",
  };

  const visibleCard = dealerHand[0].name;
  await message.reply(
    `🧑‍⚖️ Dealer está na mesa.\n• Carta visível: ${visibleCard}\n• Outra carta está virada.`
  );

  const playerList = [...newSession.players.values()]
    .map((p) => p.nickname)
    .join(", ");
  return await chat.sendMessage(`🃏 Jogo iniciado!\nJogadores: ${playerList}`);
}

export async function handleDraw (message, playerId) {
  const chat = await message.getChat();
  const groupId = chat.id._serialized;
  const session = getBlackjackSession(groupId);

  if (!session.started) return await message.reply("⛔ Jogo não iniciado.");
  if (!session.players.has(playerId))
    return await message.reply("❌ Você não está no jogo.");

  const player = session.players.get(playerId);
  if (player.status !== "playing")
    return await message.reply("⚠️ Você já parou ou estourou.");

  const card = session.deck.shift();
  player.hand.push(card);
  player.total = calculateTotal(player.hand);

  let msg = `🃏 Você puxou: ${card.name}\nTotal: ${player.total}`;
  if (player.total > 21) {
    player.status = "busted";
    msg += `\n💥 Você estourou!`;
    await message.reply(
      `💥 ${player.nickname} estourou com ${player.total} pontos.`
    );
  }

  await message.client.sendMessage(playerId, msg);
  if (isGameOver(session)) await sendResults(message, session);
}

export async function handleStand(message, playerId) {
  const chat = await message.getChat();
  const groupId = chat.id._serialized;
  const session = getBlackjackSession(groupId);

  const player = session.players.get(playerId);
  if (!player || player.status !== "playing")
    return await message.reply("⚠️ Você já parou ou não está jogando.");

  player.status = "stood";
  await message.reply(`✋ ${player.nickname} parou.`);

  if (isGameOver(session)) await sendResults(message, session);
}

export async function handleStatus(message) {
  const groupId = (await message.getChat()).id._serialized;
  const session = getBlackjackSession(groupId);

  if (!session.started)
    return await message.reply("📴 Nenhum jogo em andamento.");

  let status = "📋 *Status do jogo:*\n";
  for (const [, player] of session.players.entries()) {
    status += `- ${player.nickname} (${player.status})\n`;
  }

  status += `\n🧑‍⚖️ Dealer mostrou: ${session.dealer.hand[0].name}`;
  await message.reply(status);
}

export async function handleReset(message) {
  const groupId = (await message.getChat()).id._serialized;
  resetBlackjackSession(groupId);
  return await message.reply("♻️ Blackjack reiniciado.");
}

export async function sendResults(message, session) {
  const chat = await message.getChat();
  const groupId = chat.id._serialized;

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
    result = result.trim();
  } else {
    result += `\n😬 Ninguém venceu o dealer.`;
  }

  for (const [id, p] of session.players.entries()) {
    if (!winners.find(([wid]) => wid === id)) {
      await addPoints(groupId, id, "blackjack", 0, "loss");
    }
  }

  session.started = false;

  chat.sendMessage(result);
}

export async function sendHelp(message) {
  return await message.reply(`📝 *Comandos do Blackjack:*
• \`!blackjack start @j1 @j2 @j3\`
• \`!blackjack draw\`
• \`!blackjack stand\`
• \`!blackjack status\`
• \`!blackjack reset\`
`);
}
