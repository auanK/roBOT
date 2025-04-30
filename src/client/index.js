import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

export const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: 'new'
  }
});

client.on("qr", qr => {
  console.log("⚠️ Escaneie o QR Code:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ Bot conectado!");
});

client.on("auth_failure", msg => {
  console.error("❌ Falha na autenticação:", msg);
});

client.on("disconnected", reason => {
  console.warn("⚠️ Desconectado:", reason);
});