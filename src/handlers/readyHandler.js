import scheduleMessageSender from "../utils/scheduledMessages.js";
import startClimateScheduler from "../utils/scheduledClimate.js";

export default function onReady(sock) {
  // Agendador de mensagens
  scheduleMessageSender(sock);

  // Agendador de clima
  startClimateScheduler(sock);
}
