import {
  setProfileProperty,
  getProfile,
} from "../../services/profileService.js";
import { getUserName } from "../../services/userService.js";

async function set({ sock, message, chatId, senderId, args }) {
  const property = args.shift()?.toLowerCase();
  const value = args.join(" ");

  if (!["nick", "desc"].includes(property)) {
    return sock.sendMessage(
      chatId,
      {
        text: '❌ Propriedade inválida. Use "nick" para apelido ou "desc" para descrição.',
      },
      { quoted: message }
    );
  }

  const propertyName = property === "nick" ? "nickname" : "description";

  if (!value) {
    return sock.sendMessage(
      chatId,
      { text: `❌ Faltou o valor. Uso: !profile set ${property} <texto>` },
      { quoted: message }
    );
  }

  await setProfileProperty(chatId, senderId, propertyName, value);
  await sock.sendMessage(
    chatId,
    {
      text: `✅ ${
        propertyName === "nickname" ? "Apelido" : "Descrição"
      } atualizada com sucesso!`,
    },
    { quoted: message }
  );
}

async function view({ sock, message, chatId, senderId }) {
  const mentionedJid =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
    senderId;

  const profile = await getProfile(chatId, mentionedJid);
  const userName = await getUserName(mentionedJid, chatId);

  const nickname = profile?.nickname || "Não definido";
  const description = profile?.description || "Não definida";

  const reply = `👤 *Perfil de ${userName}*\n\n*Apelido:* ${nickname}\n*Descrição:* ${description}`;

  await sock.sendMessage(chatId, { text: reply }, { quoted: message });
}

export { set, view };
