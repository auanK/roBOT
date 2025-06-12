import makeWASocket from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import handleMessage from "../handlers/messageHandler.js";
import onReady from "../handlers/readyHandler.js";

const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } =
  makeWASocket;
const makeWASocket_ = makeWASocket.default;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(
    `Usando a versão do Baileys: ${version}. Mais recente? ${isLatest}`
  );

  const sock = makeWASocket_({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("⚠️ Escaneie o QR Code:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        `❌ Conexão fechada. Motivo: ${lastDisconnect.error?.message}. Reconectando: ${shouldReconnect}`
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ Conexão aberta, bot está online!");
      onReady(sock);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const receivedMessages = m.messages;
    
    const unreadMessages = receivedMessages.filter(msg => !msg.key.fromMe).map(msg => msg.key);
    
    if (unreadMessages.length > 0) {
      await sock.readMessages(unreadMessages);
    }

    for (const message of receivedMessages) {
        if (message.key.remoteJid === "status@broadcast" || !message.message) {
            continue;
        }
        await handleMessage(sock, message);
    }
  });
  
  return sock;
}

export { connectToWhatsApp };

