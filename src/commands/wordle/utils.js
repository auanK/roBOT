import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const savePath = path.join(__dirname, "../../data/wordle.history.json");
const wordsPath = path.join(__dirname, "../../data/wordle.words.json");

export async function loadGameData() {
  try {
    const data = await readFile(savePath, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveGameData(data) {
  await writeFile(savePath, JSON.stringify(data, null, 2));
}

export async function getValidWords() {
  try {
    const data = await readFile(wordsPath, "utf8");
    return JSON.parse(data).map((w) => w.toLowerCase());
  } catch {
    return [];
  }
}

export function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}