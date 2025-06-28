import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordsPath = path.join(__dirname, "../../data/wordle.words.json");

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
