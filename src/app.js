import dotenv from "dotenv";
dotenv.config();

import { connectToWhatsApp } from "./client/index.js";
import { waitForInternet } from "./utils/checkInternet.js";
import handleMessage from "./handlers/messageHandler.js";

async function startBot() {
  console.log("Verificando conexão com a internet...");
  const connected = await waitForInternet();

  if (!connected) {
    console.log("❌ Sem conexão, encerrando bot");
    process.exit(1);
  }

  console.log("✅ Conexão estabelecida! Iniciando bot...");

  const sock = await connectToWhatsApp();

  sock.ev.on("messages.upsert", async (m) => {
    const message = m.messages[0];

    if (message.key.remoteJid === "status@broadcast" || !message.message) {
      return;
    }

    await handleMessage(sock, m);
  });
}

startBot();
