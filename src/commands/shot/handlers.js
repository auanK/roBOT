import { getShotSession, resetShotSession } from "./session.js";
import { shoot, nextTurn, getCurrentPlayerId } from "./engine.js";
import { generateBarrel, formatLivesStatus } from "./utils.js";
import { addPoints } from "../../services/statsService.js";
import {
  registerUser,
  getUserName,
  normalizeUserId,
} from "../../services/userService.js";
import { getGroupAlias, registerGroup } from "../../services/groupService.js";

const totalLives = 3;

// Inicia uma partida de Shot no grupo
export async function handleStart({ sock, message, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  let session = getShotSession(groupId);

  if (session.started) {
    return sock.sendMessage(
      chatId,
      { text: "⚠️ Já existe uma partida de Shot em andamento!" },
      { quoted: message }
    );
  }

  const mentioned =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0 || mentioned.length > 3) {
    return sock.sendMessage(
      chatId,
      { text: "❗ Uso: *!shot start @j1 @j2 ... (máx. 3)*" },
      { quoted: message }
    );
  }

  // Inicializa a sessão do jogo
  resetShotSession(groupId);
  session = getShotSession(groupId);
  session.started = true;
  session.barrel = generateBarrel();

  const allPlayerIds = [senderId, ...mentioned].map((id) =>
    normalizeUserId(id)
  );

  const groupName =
    (await sock.groupMetadata(chatId))?.subject || "Grupo Desconhecido";

  // Registra o grupo caso não esteja registrado
  await registerGroup(groupId, groupName);

  for (const id of allPlayerIds) {
    // Pega o nome do usuário
    const nickname = await getUserName(id, groupId);

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
  const firstPlayer = session.players.get(getCurrentPlayerId(session));

  // Monta uma lista mostrando o nome dos jogadores e quantas vidas eles têm
  const playersStatus = formatLivesStatus(session.players, totalLives);

  // Envia a mensagem de início do jogo
  const startMessage =
    `🔫 *Roleta Russa iniciada!*\n\n` +
    `🎯 Primeiro a jogar: ${firstPlayer.nickname}\n` +
    `• Tambor carregado com ${live} balas *cheias* e ${blank} *vazias*\n\n` +
    `👥 *Jogadores:*\n${playersStatus}`;

  // Envia a mensagem de início do jogo
  return sock.sendMessage(
    chatId,
    { text: startMessage },
    {
      quoted: message,
    }
  );
}

// Lida com o comando de tiro
export async function handleShoot({ sock, message, args, chatId, senderId }) {
  // Identificação do grupo e da sessão
  const groupId = await getGroupAlias(chatId);
  const session = getShotSession(groupId);

  // Verificações iniciais
  if (!session.started)
    return sock.sendMessage(
      chatId,
      { text: "⛔ O jogo ainda não começou." },
      { quoted: message }
    );
  if (!session.players.has(senderId))
    return sock.sendMessage(
      chatId,
      { text: "❌ Você não está no jogo." },
      { quoted: message }
    );

  // Checa se o jogador está vivo e se é a vez dele
  const shooter = session.players.get(senderId);
  if (shooter.status === "dead")
    return sock.sendMessage(
      chatId,
      { text: "☠️ Você já morreu." },
      { quoted: message }
    );
  if (getCurrentPlayerId(session) !== senderId)
    return sock.sendMessage(
      chatId,
      { text: "⏳ Não é sua vez!" },
      { quoted: message }
    );

  // Determina o alvo do tiro
  const mentionedId =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const rawTargetId = args[1] === "self" ? senderId : mentionedId;

  const targetId = normalizeUserId(rawTargetId);

  const target = session.players.get(targetId);
  if (target.status === "dead")
    return sock.sendMessage(
      chatId,
      { text: "☠️ Esse jogador já está morto." },
      { quoted: message }
    );

  // Executa o tiro e recebe o resultado
  const result = shoot(session, targetId);

  // Monsta a mensagem de resposta
  let shootMsg = "";
  if (result.fatal) {
    shootMsg =
      targetId === senderId
        ? `💀 *${shooter.nickname}* tentou a sorte... e se auto-*eliminou*!`
        : `💀 *${shooter.nickname}* mandou bem! *${target.nickname}* foi eliminado!`;
  } else if (result.damageApplied) {
    shootMsg =
      targetId === senderId
        ? `💥 *${shooter.nickname}* se feriu, mas ainda tá de pé!`
        : `💥 *${shooter.nickname}* acertou *${target.nickname}*! ⚠️ Vidas restantes: ${target.lives}`;
  } else {
    shootMsg =
      targetId === senderId
        ? `🔫 *${shooter.nickname}* apertou o gatilho... *click!* a bala era falsa!`
        : `🔫 *${shooter.nickname}* tentou acertar *${target.nickname}*, mas era só uma bala de festim!`;
  }

  await sock.sendMessage(chatId, { text: shootMsg }, { quoted: message });

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

    return sock.sendMessage(chatId, {
      text: `🏆 *Fim de jogo!* Sobrevivente: ${winner.nickname}`,
    });
  }

  // Se o tambor foi recarregado exibe as novas balas
  if (result.reloaded) {
    sock.sendMessage(chatId, {
      text: `♻️ *Tambor recarregado!* Novo tambor com ${result.live} balas *cheias* e ${result.blank} *vazias*.`,
    });
  }

  // Decide se o turno deve ser pulado ou não
  // (se houve dano ou o alvo foi outra pessoa)
  const skipTurn = targetId !== senderId || result.damageApplied;
  if (skipTurn) nextTurn(session);

  const nextPlayer = session.players.get(getCurrentPlayerId(session));

  if (!skipTurn) {
    return sock.sendMessage(chatId, {
      text: `🔄 Jogue de novo, *${shooter.nickname}*!`,
    });
  }

  // Monta o status do jogo
  const statusSummary = formatLivesStatus(session.players, totalLives);

  // Envia a mensagem de status do jogo
  const nextTurnMsg =
    `➡️ Agora é a vez de *${nextPlayer.nickname}*\n\n` +
    `❤️ *Status das vidas:*\n${statusSummary}`;
  return sock.sendMessage(chatId, { text: nextTurnMsg.trim() });
}

// Lida com o uso de itens
export async function handleUseItem({ sock, message, args, chatId, senderId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getShotSession(groupId);

  if (!session.started)
    return sock.sendMessage(
      chatId,
      { text: "⛔ O jogo ainda não começou." },
      { quoted: message }
    );
  if (!session.players.has(senderId))
    return sock.sendMessage(
      chatId,
      { text: "❌ Você não está no jogo." },
      { quoted: message }
    );

  const player = session.players.get(senderId);
  if (player.status === "dead")
    return sock.sendMessage(
      chatId,
      { text: "☠️ Você já morreu." },
      { quoted: message }
    );

  const item = args[1]?.toLowerCase();
  if (!item)
    return sock.sendMessage(
      chatId,
      { text: "❗ Uso: *!shot use <item>*" },
      { quoted: message }
    );
  if (!player.items.includes(item))
    return sock.sendMessage(
      chatId,
      { text: "❌ Item inválido." },
      { quoted: message }
    );

  let replyMsg = "";
  switch (item) {
    case "pill":
      if (player.lives >= totalLives)
        return sock.sendMessage(
          chatId,
          { text: "❤️ Sua vida já está cheia." },
          { quoted: message }
        );
      player.lives += 1;
      replyMsg = `💊 *${player.nickname}* usou uma pílula e ganhou uma vida!`;
      break;
    case "scope":
      const bullet = session.barrel[session.currentBarrelIndex];
      const bulletText = bullet === "live" ? "cheia" : "vazia";
      replyMsg = `🔍 *${player.nickname}* usou uma lupa e descobriu que a próxima bala é ${bulletText}!`;
      break;
    case "double-barrel":
      if (player.doubleBarrelReady)
        return sock.sendMessage(
          chatId,
          { text: "❗ Você já usou o cano duplo." },
          { quoted: message }
        );
      player.doubleBarrelReady = true;
      replyMsg = `🔫 *${player.nickname}* usou o cano duplo! O próximo tiro causará dano dobrado.`;
      break;
    default:
      return sock.sendMessage(
        chatId,
        { text: "❗ Você não tem esse item." },
        { quoted: message }
      );
  }

  player.items.splice(player.items.indexOf(item), 1);
  return sock.sendMessage(chatId, { text: replyMsg }, { quoted: message });
}

// Envia o status do jogo
export async function handleStatus({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  const session = getShotSession(groupId);

  if (!session.started)
    return sock.sendMessage(
      chatId,
      { text: "📴 Nenhum jogo em andamento." },
      { quoted: message }
    );

  const currentPlayer = session.players.get(getCurrentPlayerId(session));

  let statusText = "📋 *Status do jogo:*\n";
  statusText += formatLivesStatus(session.players, totalLives);
  statusText += `\n➡️ Vez de: ${currentPlayer.nickname}`;
  return sock.sendMessage(chatId, { text: statusText }, { quoted: message });
}

// Reseta a sessão do jogo
export async function handleReset({ sock, message, chatId }) {
  const groupId = await getGroupAlias(chatId);
  resetShotSession(groupId);
  return sock.sendMessage(
    chatId,
    { text: "♻️ Jogo resetado." },
    { quoted: message }
  );
}

// Envia a mensagem de ajuda com os comandos do jogo
export async function sendHelp({ sock, message, chatId }) {
  const helpText = `📝 *Comandos do Shot (Roleta Russa):*\n• \`!shot start @j1 @j2 @j3\`\n• \`!shot use <item>\`\n• \`!shot shoot @alvo\` ou \`self\`\n• \`!shot status\`\n• \`!shot reset\``;
  return sock.sendMessage(
    chatId,
    { text: helpText.trim() },
    { quoted: message }
  );
}
