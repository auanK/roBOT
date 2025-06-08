import cron from "node-cron";
import fs from "fs";
import path from "path";
import { formatWeather } from "./weatherUtils.js";

const CLIMATE_PATH = path.resolve("src/data/schedules.climate.json");

// Lê agendamentos de clima do arquivo
function loadSchedules() {
  try {
    const data = fs.readFileSync(CLIMATE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Erro ao ler schedules.climate.json:", err.message);
    return [];
  }
}
// Agenda o envio de mensagens de clima
function scheduleClimate(sock, { times, cities, to }) {
  times.forEach((cronTime) => {
    if (!cron.validate(cronTime)) return;

    cron.schedule(cronTime, async () => {
      try {
        const weatherReports = await Promise.all(cities.map(formatWeather));
        const message = [
          "📍 *Boletim do Clima*",
          `🕒 ${new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          "",
          ...weatherReports,
          "",
          "Atualizado via OpenWeather",
        ].join("\n");

        await sock.sendMessage(to, { text: message });
        console.log(`✅ [Clima] Enviado para ${to}`);
      } catch (err) {
        console.error(`❌ Erro no envio de clima:`, err.message);
      }
    });

    console.log(`✅ Agendado [Clima] para ${to} → ${cronTime}`);
  });
}
// Inicia o agendador de clima
export default function startClimateScheduler(sock) {
  const schedules = loadSchedules();
  schedules.forEach((schedule) => scheduleClimate(sock, schedule));
}
