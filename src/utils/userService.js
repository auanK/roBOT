import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersPath = path.join(__dirname, "../data/users.meta.json");

export async function loadUsers() {
  try {
    const data = await readFile(usersPath, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveUsers(data) {
  await writeFile(usersPath, JSON.stringify(data, null, 2));
}

export async function registerUser(userId, pushname) {
  const users = await loadUsers();

  if (!users[userId]) {
    users[userId] = {
      pushname,
      createdAt: new Date().toISOString(),
    };
    await saveUsers(users);
  }
}

export async function getUserDisplayName(userId, groupId, allUsers = null) {
  const users = allUsers || (await loadUsers());

  const globalUser = users[userId];
  if (globalUser?.pushname) {
    return globalUser.pushname;
  }

  return `Usuário (${userId.slice(0, 4)})`;
}
