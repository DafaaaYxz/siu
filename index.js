require("./setting.js");
require("./lib/myfunction.js");
require("./lib/message.js");
const {
    default: makeWASocket,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    fetchLatestBaileysVersion, 
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    extractMessageContent, 
    jidDecode,
    MessageRetryMap,
    jidNormalizedUser, 
    proto,
    makeInMemoryStore, 
    getContentType,
    areJidsSameUser,
    generateWAMessage, 
    delay, 
    Browsers, 
} = require("@skyzopedia/baileys-mod");
const readline = require("readline");
const pino = require("pino");
const fs = require("fs");
const chalk = require("chalk");
const serialize = require("./lib/serialize.js");
const FileType = require("file-type");
global.groupMetadataCache = new Map();

async function startBot() {
  const store = await makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version, 
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    generateHighQualityLinkPreview: true,
    browser: Browsers.iOS("Safari"), 
    getMessage: async (key) => {
			if (store) {
				const msg = await store.loadMessage(key.remoteJid, key.id)
				return msg.message || undefined
			}
    },
    cachedGroupMetadata: async (jid) => {
        if (!global.groupMetadataCache.has(jid)) {
            const metadata = await sock.groupMetadata(jid).catch((err) => {});
            await global.groupMetadataCache.set(jid, metadata);
            return metadata;
        }
        return global.groupMetadataCache.get(jid);
    }
  });

  if (!sock.authState.creds.registered) {
  console.log(chalk.white("• Request Pairing Code ..."))
    setTimeout(async () => {    
      const code = await sock.requestPairingCode(global.pairingNumber.trim(), "AAAAAAAA");
      console.log(chalk.white(`• Kode Pairing: ${code}`));
     }, 6000)
    };

  sock.ev.on("creds.update", await saveCreds);
  store?.bind(sock.ev)	

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) startBot();
      else console.log("Device Logged out, hapus folder /session untuk login ulang.");
    } else if (connection === "open") {
      botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net"
      console.log(`• Bot Berhasil Tersambung\n• Nama: ${sock?.user?.name || "Tidak terdeteksi"}\n• WhatsApp: ${botNumber.split("@")[0]}\n`)
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return
    let m = await serialize(sock, msg)
    require("./message.js")(sock, m)
  });
  
  sock.ev.on("group-participants.update", async (update) => {
  let { id, author, participants, action } = update;
  const groupMetadata = await sock.groupMetadata(id);
  global.groupMetadataCache.set(id, groupMetadata);
  try {
  let botSettings = JSON.parse(fs.readFileSync("./collection/database.json"));
  if (!botSettings.welcome) {
    return;
  }
  const groupSubject = groupMetadata.subject;
  const commonMessageSuffix = `\n\n📢 Jangan lupa join grup :\n${global.linkgroup}`;
  for (const participant of participants) {
    let messageText = "";
    const authorName = author ? author.split("@")[0] : "";
    const participantName = typeof participant == "string" ? participant?.split("@")[0] : participant?.id?.split("@")[0] || ""
    switch (action) {
      case "add":
        messageText =
          !author ? `@${participantName} Selamat datang di grup ${groupSubject}` : `@${authorName} Telah *menambahkan* @${participantName} ke dalam grup.`
        break;
      case "remove":
        messageText =
          !author ? `@${participantName} Telah *keluar* dari grup.`
            : `@${authorName} Telah *mengeluarkan* @${participantName} dari grup.`;
        break;
      case "promote":
        messageText = `@${authorName} Telah *menjadikan* @${participantName} sebagai *admin* grup.`;
        break;
      case "demote":
        messageText = `@${authorName} Telah *menghentikan* @${participantName} sebagai *admin* grup.`;
        break;
      default:
        continue;
    }

    messageText += commonMessageSuffix;

    try {
      await sock.sendMessage(id, {
        text: messageText,
        mentions: [author || "", participant.id],
      }, { quoted: null });
    } catch (error) {
    console.log(error)
    }
  }
  } catch (err) {
  console.log(err)
  }
  })
  
  sock.toLid = async (pn) => pn
  
  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    }
    return jid;
 };
  
  sock.downloadMediaMessage = async (m, type, filename = "") => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (filename) await fs.promises.writeFile(filename, buffer);
    return filename && fs.existsSync(filename) ? filename : buffer;
 };
 
 sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    const quoted = message.msg ? message.msg : message;
    const mime = (message.msg || message).mimetype || "";
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
    const fil = Date.now();
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const type = await FileType.fromBuffer(buffer);
    const trueFileName = attachExtension ? `./sampah/${fil}.${type.ext}` : filename;
    fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
 };
 
 return sock
}

startBot();
