import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";

export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Usando a versão do Baileys: ${version}, É a mais recente? ${isLatest}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("⚠️ Escaneie o QR Code abaixo:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "❌ Conexão fechada. Motivo:",
        lastDisconnect.error,
        ". Reconectando:",
        shouldReconnect
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ Conexão aberta, bot está online!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock; o
}