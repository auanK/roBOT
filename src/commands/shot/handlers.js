import { getShotSession, resetShotSession } from "./session.js";
import { shoot, nextTurn, getCurrentPlayerId } from "./engine.js";
import { generateBarrel, extractMentionedIds, formatLivesStatus } from "./utils.js";
import { addPoints } from "../../utils/statsService.js";
import { registerUser } from "../../utils/userService.js";
import { registerGroup, getGroupAlias } from "../../utils/groupService.js";

const totalLives = 3;

// Inicia uma partida de Shot no grupo´
export async function handleStart(message, playerId) {
  const chat = await message.getChat();
  const rawGroupId = chat.id._serialized;
  const groupId = await getGroupAlias(rawGroupId);
  const session = getShotSession(groupId);

  if (session.started) {
    return await message.reply(
      "⚠️ Já existe uma partida de Shot em andamento!"
    );
  }

  const mentioned = extractMentionedIds(message);
  if (mentioned.length === 0 || mentioned.length > 3) {
    return await message.reply("❗ Uso: *!shot start @j1 @j2 ... (máx. 3)*");
  }

  // Inicializa a sessão do jogo
  session.started = true;
  session.barrel = generateBarrel();
  session.currentBarrelIndex = 0;
  session.players = new Map();
  session.turnOrder = [];
  session.currentTurnIndex = 0;

  const allPlayers = [playerId, ...mentioned];
  const mentions = await message.getMentions();
  const author = await message.getContact();

  // Registra o grupo caso não esteja registrado
  await registerGroup(groupId, chat.name);

  for (const id of allPlayers) {
    // Encontra o contato correspondente para usar de apelido no jogo (apelido que a pessoa definiu no whatsapp)
    const contact = id === playerId ? author : mentions.find((c) => c.id._serialized === id);
    const nickname = contact?.pushname || contact?.name || id;

    // Inicializa o jogador
    session.players.set(id, {
      nickname,
      status: "alive",
      lives: totalLives,
      items: [],
    });

    // Adiciona o jogador à lista de jogadores
    session.turnOrder.push(id);

    // Registra o jogador caso não esteja registrado
    await registerUser(id, nickname);
  }

  // Conta quantas balas estão cheias e quantas estão vazias
  const live = session.barrel.filter((b) => b === "live").length;
  const blank = session.barrel.length - live;

  // Descobre quem é o primeiro jogador
  const first = session.players.get(getCurrentPlayerId(session)).nickname;

  // Monta uma lista mostrando o nome dos jogadores e quantas vidas eles têm
  const playersStatus = formatLivesStatus(session.players, totalLives);

  // Envia a mensagem de início do jogo
  return await message.reply(
    `🔫 *Roleta Russa iniciada!*\n\n` +
    `🎯 Primeiro a jogar: ${first}\n` +
    `• Tambor carregado com ${live} balas *cheias* e ${blank} *vazias*\n\n` +
    `👥 *Jogadores:*\n${playersStatus}`
  );
}

// Lida com o comando de tiro
export async function handleShoot(message, playerId, args) {
  // Identificação do grupo e da sessão
  const chat = await message.getChat();
  const rawGroupId = chat.id._serialized;
  const groupId = await getGroupAlias(rawGroupId);
  const session = getShotSession(groupId);

  // Verificações iniciais
  if (!session.started)
    return await message.reply("⛔ O jogo ainda não começou.");
  if (!session.players.has(playerId))
    return await message.reply("❌ Você não está no jogo.");

  // Checa se o jogador está vivo e se é a vez dele
  const shooter = session.players.get(playerId);
  if (shooter.status === "dead")
    return await message.reply("☠️ Você já morreu.");
  if (getCurrentPlayerId(session) !== playerId)
    return await message.reply("⏳ Não é sua vez!");

  // Determina o alvo do tiro
  const targetId = args[1] === "self" ? playerId : message.mentionedIds?.[0];
  if (!targetId || !session.players.has(targetId))
    return await message.reply("🚫 Jogador inválido.");

  const target = session.players.get(targetId);
  if (target.status === "dead")
    return await message.reply("☠️ Esse jogador já está morto.");

  // Executa o tiro e recebe o resultado
  const result = shoot(session, targetId);

  // Monta a mensagem de resposta
  let msg = "";
  if (result.fatal) {
    msg =
      targetId === playerId
        ? `💀 *${shooter.nickname}* tentou a sorte... e se auto-*eliminou*!`
        : `💀 *${shooter.nickname}* mandou bem! *${target.nickname}* foi eliminado!`;
  } else if (result.damageApplied) {
    msg =
      targetId === playerId
        ? `💥 *${shooter.nickname}* se feriu, mas ainda tá de pé!`
        : `💥 *${shooter.nickname}* acertou *${target.nickname}*! ⚠️ Vidas restantes: ${target.lives}`;
  } else {
    msg =
      targetId === playerId
        ? `🔫 *${shooter.nickname}* apertou o gatilho... *click!* a bala era falsa!`
        : `🔫 *${shooter.nickname}* tentou acertar *${target.nickname}*, mas era só uma bala de festim!`;
  }
  await message.reply(msg);

  // Caso o jogo acabe, atualiza os pontos dos jogadores e reseta a sessão
  if (result.gameOver) {
    const winner = session.players.get(result.winnerId);
    const points = 50 + (session.turnOrder.length - 2) * 10;

    await addPoints(groupId, result.winnerId, "shot", points, "win");
    for (const id of session.turnOrder) {
      if (id !== result.winnerId)
        await addPoints(groupId, id, "shot", 0, "loss");
    }

    resetShotSession(groupId);

    return await message.reply(`🏆 *Fim de jogo!* Sobrevivente: ${winner.nickname}`);
  }

  // Se o tambor foi recarregado exibe as novas balas
  if (result.reloaded) {
    chat.sendMessage(
      `♻️ *Tambor recarregado!* Novo tambor com ${result.live} balas *cheias* e ${result.blank} *vazias*.`
    );
  }

  // Decide se o turno deve ser pulado ou não
  // (se houve dano ou o alvo foi outra pessoa)
  const skipTurn = targetId !== playerId || result.damageApplied;
  if (skipTurn) nextTurn(session);

  const nextPlayerId = getCurrentPlayerId(session);
  const nextPlayer = session.players.get(nextPlayerId);

  if (!skipTurn) {
    return await chat.sendMessage(`🔄 Jogue de novo`);
  }

  // Monta o status do jogo
  const statusResumo = formatLivesStatus(session.players, totalLives);

  // Envia a mensagem de status do jogo
  msg =
    `➡️ Agora é a vez de *${nextPlayer.nickname}*\n\n` +
    `❤️ *Status das vidas:*\n${statusResumo}`.trim();

  return await chat.sendMessage(msg);
}

// Lida com o uso de items
export async function handleUseItem(message, playerId, args) {
  const chat = await message.getChat();
  const rawGroupId = chat.id._serialized;
  const groupId = await getGroupAlias(rawGroupId);
  const session = getShotSession(groupId);

  if (!session.started)
    return await message.reply("⛔ O jogo ainda não começou.");

  if (!session.players.has(playerId))
    return await message.reply("❌ Você não está no jogo.");

  const player = session.players.get(playerId);
  if (player.status === "dead")
    return await message.reply("☠️ Você já morreu.");

  const item = args[1]?.toLowerCase();

  if (!item) {
    return await message.reply("❗ Uso: *!shot use <item>*");
  }

  if (!player.items.includes(item)) {
    return await message.reply("❌ Item inválido.");
  }

  let msg = "";
  switch (item) {
    case "pill":
      if (player.lives >= totalLives)
        return await message.reply("❤️ Sua vida já está cheia.");
      player.lives += 1;
      msg = `💊 *${player.nickname}* usou uma pílula e ganhou uma vida!`;
      break;
    case "scope":
      const bullet = session.barrel[session.currentBarrelIndex];
      const bulletText = bullet === "live" ? "cheia" : "vazia";
      msg = `🔍 *${player.nickname}* usou uma lupa e descobriu que a próxima bala é ${bulletText}!`;
      break;
    case "double-barrel":
      if (player.doubleBarrelReady) {
        return await message.reply("❗ Você já usou o cano duplo.");
      }
      player.doubleBarrelReady = true;
      msg = `🔫 *${player.nickname}* usou o cano duplo! O próximo tiro causará dano dobrado.`;
      break;;
    default:
      return await message.reply("❗ Você não tem esse item.");
  }

  player.items.splice(player.items.indexOf(item), 1);
  return await message.reply(msg);
}


// Envia o status do jogo
export async function handleStatus(message) {
  const groupId = (await message.getChat()).id._serialized;
  const session = getShotSession(groupId);

  if (!session.started)
    return await message.reply("📴 Nenhum jogo em andamento.");

  const current = session.players.get(getCurrentPlayerId(session)).nickname;

  let text = "📋 *Status do jogo:*\n";
  text += formatLivesStatus(session.players, totalLives);
  text += `\n➡️ Vez de: ${current}`;

  return await message.reply(text);
}

// Reseta a sessão do jogo
export async function handleReset(message) {
  const groupId = (await message.getChat()).id._serialized;
  resetShotSession(groupId);
  return await message.reply("♻️ Jogo resetado.");
}

// Envia a mensagem de ajuda com os comandos do jogo
export async function sendHelp(message) {
  return await message.reply(
    `
📝 *Comandos do Shot (Roleta Russa):*
• \`!shot start @j1 @j2 @j3\`
• \`!shot use <item>\`
• \`!shot shoot @alvo\` ou \`self\`
• \`!shot status\`
• \`!shot reset\`
`.trim()
  );
}
