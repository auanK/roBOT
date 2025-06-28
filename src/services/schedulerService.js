import cron from "node-cron";
import * as db from "../database/database.js";
import { formatWeather } from "../utils/weatherUtils.js";

function getRandom(list) {
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}

function _scheduleMessage(sock, schedule) {
  const { id, cronExpressions, payload, targetGroupId } = schedule;

  if (!payload?.messages || payload.messages.length === 0) {
    console.warn(
      `[Agendador] Tarefa de mensagem ${id} não possui mensagens no payload.`
    );
    return;
  }

  cronExpressions.forEach((cronTime) => {
    if (!cron.validate(cronTime)) {
      console.error(
        `[Agendador] Expressão cron inválida para a tarefa ${id}: ${cronTime}`
      );
      return;
    }

    cron.schedule(cronTime, async () => {
      try {
        const message = getRandom(payload.messages);
        await sock.sendMessage(targetGroupId, { text: message });
        console.log(
          `✅ [Mensagem Agendada] Tarefa ${id} enviada para ${targetGroupId}`
        );
      } catch (err) {
        console.error(
          `❌ Erro no envio da tarefa de mensagem (${id}):`,
          err.message
        );
      }
    });

    console.log(
      `✅ Agendado [Mensagem] ${id} para ${targetGroupId} → ${cronTime}`
    );
  });
}

function _scheduleClimate(sock, schedule) {
  const { id, cronExpressions, payload, targetGroupId } = schedule;

  if (!payload?.cities || payload.cities.length === 0) {
    console.warn(
      `[Agendador] Tarefa de clima ${id} não possui cidades no payload.`
    );
    return;
  }

  cronExpressions.forEach((cronTime) => {
    if (!cron.validate(cronTime)) {
      console.error(
        `[Agendador] Expressão cron inválida para a tarefa ${id}: ${cronTime}`
      );
      return;
    }

    cron.schedule(cronTime, async () => {
      try {
        const weatherReports = await Promise.all(
          payload.cities.map(formatWeather)
        );
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

        await sock.sendMessage(targetGroupId, { text: message });
        console.log(
          `✅ [Clima Agendado] Tarefa ${id} enviada para ${targetGroupId}`
        );
      } catch (err) {
        console.error(
          `❌ Erro no envio da tarefa de clima (${id}):`,
          err.message
        );
      }
    });

    console.log(
      `✅ Agendado [Clima] ${id} para ${targetGroupId} → ${cronTime}`
    );
  });
}

export async function startSchedulers(sock) {
  console.log("Iniciando agendador de tarefas...");
  const schedules = await db.schedules.getAll();

  if (!schedules || schedules.length === 0) {
    console.log("Nenhuma tarefa para agendar.");
    return;
  }

  for (const schedule of schedules) {
    switch (schedule.type) {
      case "message":
        _scheduleMessage(sock, schedule);
        break;
      case "climate":
        _scheduleClimate(sock, schedule);
        break;
      default:
        console.warn(
          `[Agendador] Tipo de tarefa desconhecido: ${schedule.type}`
        );
        break;
    }
  }
}
