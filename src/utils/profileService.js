import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profilesPath = path.join(__dirname, "../data/profiles.group.json");

async function loadProfiles() {
  try {
    const data = await readFile(profilesPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") return {};
    console.error("Erro ao carregar profiles.group.json:", error);
    return {};
  }
}

async function saveProfiles(data) {
  try {
    await writeFile(profilesPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro ao salvar profiles.group.json:", error);
  }
}

export async function setProfileProperty(groupId, userId, property, value) {
  const allProfiles = await loadProfiles();

  if (!allProfiles[groupId]) {
    allProfiles[groupId] = {};
  }
  if (!allProfiles[groupId][userId]) {
    allProfiles[groupId][userId] = {};
  }

  allProfiles[groupId][userId][property] = value;
  await saveProfiles(allProfiles);
}

export async function getProfile(groupId, userId) {
  const allProfiles = await loadProfiles();
  return allProfiles[groupId]?.[userId] || null;
}
