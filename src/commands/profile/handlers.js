import { getProfile, setProfileProperty } from "../../utils/profileService.js";
import { getUserName } from "../../utils/userService.js";
import { getGroupAlias } from "../../utils/groupService.js";

export async function handleSet({ sock, message, args, chatId, senderId }) {
  const property = args[1]?.toLowerCase();
  const value = args.slice(2).join(" ");

  if (!property || !value) {
    return sock.sendMessage(
      chatId,
      {
        text: "❗ Formato incorreto. Use:\n• `!profile set name <seu apelido>`\n• `!profile set desc <sua descrição>`",
      },
      { quoted: message }
    );
  }

  const groupId = await getGroupAlias(chatId);

  if (property === "name" || property === "nome") {
    if (value.length > 25) {
      return sock.sendMessage(
        chatId,
        { text: "❌ O apelido não pode ter mais de 25 caracteres." },
        { quoted: message }
      );
    }
    await setProfileProperty(groupId, senderId, "nickname", value);
    await sock.sendMessage(
      chatId,
      { text: `✅ Seu apelido neste grupo foi definido para: *${value}*` },
      { quoted: message }
    );
  } else if (property === "desc" || property === "descricao") {
    if (value.length > 80) {
      return sock.sendMessage(
        chatId,
        { text: "❌ A descrição não pode ter mais de 80 caracteres." },
        { quoted: message }
      );
    }
    await setProfileProperty(groupId, senderId, "description", value);
    await sock.sendMessage(
      chatId,
      { text: `✅ Sua descrição neste grupo foi atualizada!` },
      { quoted: message }
    );
  } else {
    return sock.sendMessage(
      chatId,
      {
        text: "❌ Propriedade inválida. Use `name` para apelido ou `desc` para descrição.",
      },
      { quoted: message }
    );
  }
}

export async function handleDisplay({ sock, message, chatId, senderId }) {
  const targetId =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
    senderId;
  const groupId = await getGroupAlias(chatId);

  const customProfile = await getProfile(groupId, targetId);

  const displayName = await getUserName(targetId, groupId);

  let replyMessage = `👤 *Perfil de ${displayName}*\n\n`;
  replyMessage += `*Descrição:* ${
    customProfile?.description || "Nenhuma descrição definida."
  }\n`;

  await sock.sendMessage(
    chatId,
    { text: replyMessage.trim() },
    { quoted: message }
  );
}
