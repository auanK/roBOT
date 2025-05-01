import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Caminhos para os arquivos JSON
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const groupsPath = path.join(__dirname, "../data/groups.meta.json");
const authGroupsPath = path.join(__dirname, "../data/groups.auth.json");
const aliasPath = path.join(__dirname, "../data/groups.alias.json");

// Carrega os dados dos grupos a partir do arquivo JSON
export async function loadGroups() {
  try {
    const data = await readFile(groupsPath, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Salva os dados dos grupos no arquivo JSON
export async function registerGroup(groupId, name = "Grupo sem nome") {
  const groups = await loadGroups();
  if (!groups[groupId]) {
    groups[groupId] = {
      name,
      createdAt: new Date().toISOString(),
    };
    await writeFile(groupsPath, JSON.stringify(groups, null, 2));
  }
}

// Verifica se a mensagem é de um grupo
export async function isGroupMessage(message) {
  const chat = await message.getChat();
  return chat.isGroup;
}

// Variáveis de cache
let authorizedCache = null;
let aliasCache = null;

async function reloadAuthorizedCache() {
  try {
    const raw = await readFile(authGroupsPath, "utf8");
    const { authorized = [] } = JSON.parse(raw);
    authorizedCache = new Set(authorized);
  } catch {
    authorizedCache = new Set();
  }
}

async function reloadAliasCache() {
  try {
    const raw = await readFile(aliasPath, "utf8");
    aliasCache = JSON.parse(raw);
  } catch {
    aliasCache = {};
  }
}

// Verifica se o grupo é autorizado
export async function isGroupAuthorized(groupId) {
  if (!authorizedCache) {
    await reloadAuthorizedCache();
  }

  // Verifica se o grupo já está no cache
  if (authorizedCache.has(groupId)) {
    return true;
  }

  // Grupo não estava no cache, recarrega do arquivo
  await reloadAuthorizedCache();
  return authorizedCache.has(groupId);
}


// Verifica se o grupo tem um alias
export async function getGroupAlias(groupId) {
  if (!aliasCache) {
    await reloadAliasCache();
  }

  // Verifica se o grupo já está no cache
  if (aliasCache[groupId]) {
    return aliasCache[groupId];
  }

  // Grupo não estava no cache, recarrega do arquivo
  await reloadAliasCache();
  return aliasCache[groupId] || groupId;
}