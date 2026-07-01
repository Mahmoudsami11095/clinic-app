const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

// In-memory store for active socket connections
const sessions = new Map();

// We'll store auth states here
const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Initialize a Baileys session for a specific clinic.
 * Returns an EventEmitter-like object for handling QR codes via callbacks.
 * 
 * @param {string} clinicId 
 * @param {object} callbacks { onQR, onConnected, onDisconnected }
 */
async function startSession(clinicId, callbacks, phoneNumber = null) {
  // If session is already connected, don't restart it
  if (sessions.has(clinicId)) {
    console.log(`[Clinic ${clinicId}] Session already running.`);
    if (callbacks.onConnected) callbacks.onConnected();
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSIONS_DIR, clinicId));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), // Suppress detailed logs, use 'info' for debugging
    printQRInTerminal: false,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  });

  sessions.set(clinicId, sock);

  // Handle connection updates (QR code, Ready, Disconnect)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`[Clinic ${clinicId}] New QR Code generated.`);
      if (callbacks.onQR) callbacks.onQR(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[Clinic ${clinicId}] Connection closed due to:`, lastDisconnect.error);
      
      sessions.delete(clinicId);

      if (callbacks.onDisconnected) callbacks.onDisconnected(shouldReconnect);

      // Reconnect if not logged out explicitly
      if (shouldReconnect) {
        console.log(`[Clinic ${clinicId}] Reconnecting...`);
        startSession(clinicId, callbacks, phoneNumber);
      } else {
        console.log(`[Clinic ${clinicId}] Logged out. Session deleted.`);
        // Optional: Remove session folder if logged out
        fs.rmSync(path.join(SESSIONS_DIR, clinicId), { recursive: true, force: true });
      }
    }

    if (connection === 'open') {
      console.log(`[Clinic ${clinicId}] Connection opened successfully.`);
      if (callbacks.onConnected) callbacks.onConnected();
    }
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Optional: Listen for incoming messages if you need a webhook/chatbot later
  sock.ev.on('messages.upsert', (m) => {
    // console.log(JSON.stringify(m, undefined, 2));
  });

  // Request pairing code if a phone number is provided and we aren't registered yet
  if (phoneNumber && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
        console.log(`[Clinic ${clinicId}] Generated pairing code: ${code}`);
        if (callbacks.onPairingCode) callbacks.onPairingCode(code);
      } catch (err) {
        console.error(`[Clinic ${clinicId}] Failed to request pairing code:`, err);
      }
    }, 1500);
  }

  return sock;
}

/**
 * Send a WhatsApp text message
 * 
 * @param {string} clinicId 
 * @param {string} phone e.g. "201555102395" (without +)
 * @param {string} message 
 */
async function sendMessage(clinicId, phone, message) {
  const sock = sessions.get(clinicId);
  if (!sock || !sock.user) {
    throw new Error(`Clinic ${clinicId} is not fully connected to WhatsApp. Please scan the QR code.`);
  }

  // Format phone number to WhatsApp JID format
  const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;
  
  // Send the message directly
  const sentMsg = await sock.sendMessage(jid, { text: message });
  return sentMsg;
}

/**
 * Check session status
 */
function getStatus(clinicId) {
  const sock = sessions.get(clinicId);
  return (sock && sock.user) ? 'Connected' : 'Disconnected';
}

/**
 * Logout and clean up session
 */
async function logoutSession(clinicId) {
  const sock = sessions.get(clinicId);
  if (sock) {
    try {
      await sock.logout();
    } catch (err) {
      console.error(`[Clinic ${clinicId}] Error during WhatsApp logout:`, err);
      try {
        sock.end();
      } catch (e) {}
      fs.rmSync(path.join(SESSIONS_DIR, clinicId), { recursive: true, force: true });
    }
    sessions.delete(clinicId);
  } else {
    const sessionPath = path.join(SESSIONS_DIR, clinicId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  }
}

module.exports = {
  startSession,
  sendMessage,
  getStatus,
  logoutSession
};
