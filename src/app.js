import dotenv from "dotenv";
dotenv.config();

import { connectToWhatsApp } from "./client/index.js";
import { waitForInternet } from "./utils/checkInternet.js";

async function startBot() {
  console.log("Verificando conexão com a internet...");
  const connected = await waitForInternet();

  if (!connected) {
    console.log("❌ Sem conexão, encerrando bot");
    process.exit(1);
  }

  console.log("✅ Conexão estabelecida! Iniciando bot...");
  await connectToWhatsApp();
}

startBot();