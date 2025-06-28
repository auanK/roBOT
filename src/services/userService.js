import * as db from "../database/database.js";

export function normalizeUserId(id) {
  if (!id) return null;
  return id.replace("@s.whatsapp.net", "@c.us");
}

export async function registerUser(userId, pushname) {
  if (!pushname || !userId) return;

  const normalizedId = normalizeUserId(userId);
  const currentUser = await db.users.get(normalizedId);

  if (!currentUser || currentUser.pushname !== pushname) {
    const userData = {
      id: normalizedId,
      pushname,
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };
    db.users.save(userData);
    console.log(
      `[Usuário Salvo/Atualizado] Nome: ${pushname}, ID: ${normalizedId}`
    );
  }
}

export async function getUserName(userId, groupId) {
  const normalizedId = normalizeUserId(userId);

  if (groupId) {
    const customProfile = await db.profiles.get(normalizedId, groupId);
    if (customProfile?.nickname) {
      return customProfile.nickname;
    }
  }

  const userData = await db.users.get(normalizedId);
  if (userData?.pushname) {
    return userData.pushname;
  }

  return `Usuário (${(normalizedId || userId).slice(0, 4)})`;
}
