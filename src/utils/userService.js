import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getProfile } from "./profileService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersPath = path.join(__dirname, "../data/users.meta.json");

export async function loadUsers() {
  try {
    const data = await readFile(usersPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") return {};
    return {};
  }
}

export async function saveUsers(data) {
  try {
    await writeFile(usersPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro ao salvar users.meta.json:", error);
  }
}

export function normalizeUserId(id) {
  if (!id) return null;
  return id.replace("@s.whatsapp.net", "@c.us");
}

export async function registerUser(userId, pushname) {
  if (!pushname || !userId) return;

  const users = await loadUsers();
  const normalizedId = normalizeUserId(userId);

  const currentUser = users[normalizedId];
  if (!currentUser || currentUser.pushname !== pushname) {
    users[normalizedId] = {
      pushname,
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };
    await saveUsers(users);
    console.log(
      `[Usuário Salvo/Atualizado] Nome: ${pushname}, ID: ${normalizedId}`
    );
  }
}

export async function getUserName(userId, groupId) {
  const normalizedId = normalizeUserId(userId);

  if (groupId) {
    const customProfile = await getProfile(groupId, normalizedId);
    if (customProfile?.nickname) {
      return customProfile.nickname;
    }
  }

  const users = await loadUsers();
  const userData = users[normalizedId];
  if (userData?.pushname) {
    return userData.pushname;
  }

  return `Usuário (${(normalizedId || userId).slice(0, 4)})`;
}
