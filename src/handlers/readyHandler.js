import { startSchedulers } from "../services/schedulerService.js";

export default function onReady(sock) {
  startSchedulers(sock); // Inicia os agendadores de mensagem e clima
}
