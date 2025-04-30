import dotenv from "dotenv";
dotenv.config();

import { client } from "./client/index.js";
import { waitForInternet } from "./utils/checkInternet.js";
import handleMessage from "./handlers/messageHandler.js";
import onReady from "./handlers/readyHandler.js";

(async () => {
  console.log("Verificando conexão com a internet...");
  const connected = await waitForInternet();

  if (!connected) {
    console.log("❌ Sem conexão, encerrando bot");
    process.exit(1);
  }

  console.log("✅ Conexão estabelecida! Iniciando bot...");

  client.on("ready", onReady);
  client.on("message_create", handleMessage);

  client.initialize();
})();
