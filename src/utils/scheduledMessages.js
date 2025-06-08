import cron from "node-cron";
import fs from "fs";
import path from "path";

const MESSAGES_PATH = path.resolve("src/data/schedules.messages.json");
const activeJobs = new Map();
const executedToday = new Set();

// Lê agendamentos de mensagens do arquivo
function loadSchedules() {
  try {
    const data = fs.readFileSync(MESSAGES_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Erro ao ler schedules.messages.json:", err.message);
    return [];
  }
}

// Retorna a data atual no formato YYYY-MM-DD
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// Escolhe uma mensagem aleatória de uma lista
function getRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Verifica se a expressão cron já está vencida
function isExpired(cronExpr) {
  const [min, hour, day, month] = cronExpr.split(" ").map(Number);
  const scheduledDate = new Date(
    new Date().getFullYear(),
    month - 1,
    day,
    hour,
    min
  );
  return scheduledDate <= new Date();
}

// Agenda o envio de uma mensagem
function scheduleMessage(sock, { id, cron: cronExpr, messages, to, once }) {
  if (!cron.validate(cronExpr) || activeJobs.has(id)) return;
  if (once && isExpired(cronExpr)) {
    console.log(`⏩ Ignorando vencido: ${id}`);
    return;
  }

  const job = cron.schedule(cronExpr, async () => {
    const execKey = `${getToday()}_${id}`;
    if (executedToday.has(execKey)) return;

    executedToday.add(execKey);
    const message = getRandom(messages);

    try {
      await sock.sendMessage(to, { text: message });
      console.log(`✅ [Mensagem] ${id} enviada para ${to}`);
    } catch (err) {
      console.error(`❌ Erro no envio (${id}):`, err.message);
    }
  });

  activeJobs.set(id, job);
  console.log(`✅ Agendado [Mensagem] ${id} → ${cronExpr}`);
}

// Inicia o agendador de mensagens
export default function startMessageScheduler(sock) {
  const schedules = loadSchedules();
  schedules.forEach((schedule) => scheduleMessage(sock, schedule));
}
