import scheduleMessageSender from "../utils/scheduledMessages.js";
import startClimateScheduler from "../utils/scheduledClimate.js";

export default function onReady() {
  console.log("Bot está online!");

  // Agendador de mensagens
  scheduleMessageSender();

  // Agendador de clima
  startClimateScheduler();
}
