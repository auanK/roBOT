import commands from "../commands/index.js";
import { getGroupAlias, isGroupAuthorized } from "../utils/groupService.js";
import { recordMessage } from "../utils/messageStatsService.js";

// Extrai o body de uma mensagem
function getMessageBody(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    ""
  );
}

// Normaliza o ID do usuário para o formato @c.us
function normalizeUserId(id) {
  if (!id) return null;
  return id.replace("@s.whatsapp.net", "@c.us");
}

// Verifica se a mensagem vem de um grupo autorizado
async function isAuthorized(chatId) {
  const isGroup = chatId.endsWith("@g.us");

  // Se for conversa privada, autoriza por padrão
  if (!isGroup) return true;

  const authorized = await isGroupAuthorized(chatId);
  if (!authorized) {
    console.log(`🚫 Grupo não autorizado: ${chatId}`);
  }
  return authorized;
}

// Quando o comando é enviado, ele é separado em nome e argumentos
function parseCommand(body) {
  const [name, ...args] = body.slice(1).trim().split(/\s+/);
  return { name: name.toLowerCase(), args };
}

// Log de comandos recebidos
async function logMessage(message) {
  const chatId = message.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");

  const senderId = normalizeUserId(
    message.key.participant || message.key.remoteJid
  );

  const senderName = message.pushName || senderId;

  const context = isGroup
    ? `Grupo: ${await getGroupAlias(chatId)} (${chatId})`
    : `Privado: ${senderId}`;

  console.log(
    `📩 [${new Date().toISOString()}] ${senderName} em ${context} :: ${getMessageBody(
      message
    )}`
  );
}

export default async function handleMessage(sock, m) {
  const message = m.messages[0];

  // Ignora mensagens enviadas pelo próprio bot, de status ou sem conteúdo
  if (
    message.key.fromMe ||
    message.key.remoteJid === "status@broadcast" ||
    !message.message
  ) {
    return;
  }

  const chatId = message.key.remoteJid;

  // Ignora mensagens de grupos não autorizados
  if (!(await isAuthorized(chatId))) return;

  const isGroup = chatId.endsWith("@g.us");
  const rawSenderId = isGroup ? message.key.participant : message.key.remoteJid;
  const senderId = normalizeUserId(rawSenderId);

  // Registra a mensagem para estatísticas de grupo

  if (isGroup && senderId) {
    const groupId = await getGroupAlias(chatId);
    await recordMessage(groupId, senderId);
  }

  // Extrai o corpo da mensagem
  const body = getMessageBody(message);

  // Se não for um comando, ignora
  if (!body.startsWith("!")) return;

  // Log da mensagem
  await logMessage(message);

  // Parse do comando
  const { name, args } = parseCommand(body);
  const command = commands[name];
  if (!command) return;

  // Executa o comando
  try {
    await command.run({ sock, message, args, chatId, senderId });
  } catch (err) {
    console.error(`❌ Erro no comando "!${name}":`, err);
    await sock.sendMessage(chatId, { text: `❌ Erro ao executar: !${name}` });
  }
}
