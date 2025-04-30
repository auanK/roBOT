import commands from "../commands/index.js";
import { client } from "../client/index.js";
import { isGroupAuthorized } from "../utils/groupService.js";

// Verifica se a mensagem vem de um grupo autorizado
async function isAuthorized(message) {
  const chat = await message.getChat();

  // Se for conversa privada, autoriza por padrão
  if (!chat.isGroup) return true;

  const isAuthorized = await isGroupAuthorized(chat.id._serialized);
  if (!isAuthorized) {
    console.log(`🚫 Grupo não autorizado: ${chat.name} (${chat.id._serialized})`);
  }

  return isAuthorized;
}

// Quando o comando é enviado, ele é separado em nome e argumentos
function parseCommand(body) {
  const [name, ...args] = body.slice(1).trim().split(/\s+/);
  return { name: name.toLowerCase(), args };
}

// Log de comandos recebidos
async function logMessage(message) {
  const chat = await message.getChat();
  const isGroup = chat.isGroup;

  const senderId = isGroup ? message.author : message.from;
  const senderContact = await client.getContactById(senderId);

  const senderName = senderContact?.pushname || senderContact?.name || senderId;

  const phoneNumber = senderId;

  const context = isGroup
    ? `${chat.name} (${chat.id._serialized})`
    : `Privado (${phoneNumber})`;

  console.log(
    `📩 [${new Date().toISOString()}] ${senderName} (${phoneNumber}) em ${context} :: ${
      message.body
    }`
  );
}

// Função principal que lida com mensagens
export default async function handleMessage(message) {
  const { body } = message;

  if (!body.startsWith("!")) return;

  // Autoriza a execução do comando
  if (!(await isAuthorized(message))) return;

  // Log da mensagem
  await logMessage(message);

  // Parse do comando
  const { name, args } = parseCommand(body);
  const command = commands[name];
  if (!command) return;

  // Executa o comando
  try {
    await command.run({ client, message, args });
  } catch (err) {
    console.error(`❌ Erro no comando "!${name}":`, err);
    await client.sendMessage(message.from, `❌ Erro ao executar: !${name}`);
  }
}
