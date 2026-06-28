const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const { startSession, sendMessage, getStatus } = require('./whatsapp.service');

const app = express();

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());

// In-memory store for generated QR codes waiting to be scanned
const qrStore = new Map();

/**
 * 1. Initialize Session
 * Triggers the creation of a Baileys socket for the clinic.
 */
app.post('/api/session/start', async (req, res) => {
  const { clinicId } = req.body;
  
  if (!clinicId) {
    return res.status(400).json({ error: 'clinicId is required' });
  }

  // Clear old QR if any
  qrStore.delete(clinicId);

  const callbacks = {
    onQR: async (qrString) => {
      try {
        // Convert the raw QR string into a base64 image data URL for Angular to display
        const qrDataUrl = await qrcode.toDataURL(qrString);
        qrStore.set(clinicId, qrDataUrl);
      } catch (err) {
        console.error('Failed to generate QR Data URL', err);
      }
    },
    onConnected: () => {
      console.log(`Clinic ${clinicId} connected, clearing QR.`);
      qrStore.delete(clinicId);
    },
    onDisconnected: (shouldReconnect) => {
      if (!shouldReconnect) {
        qrStore.delete(clinicId);
      }
    }
  };

  try {
    // startSession is async but returns quickly once the socket is created
    await startSession(clinicId, callbacks);
    res.json({ message: `Session started for clinic ${clinicId}. Poll /api/session/qr to get the QR code.` });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session.' });
  }
});

/**
 * 2. Get QR Code
 * Angular frontend should poll this endpoint every 2-3 seconds after starting the session
 * to get the latest QR code to display to the user.
 */
app.get('/api/session/qr', (req, res) => {
  const { clinicId } = req.query;
  
  if (!clinicId) {
    return res.status(400).json({ error: 'clinicId is required' });
  }

  const qr = qrStore.get(clinicId);
  const status = getStatus(clinicId);

  res.json({ 
    qr: qr || null, 
    status: status 
  });
});

/**
 * 3. Get Status
 * Check if a clinic is currently connected to WhatsApp.
 */
app.get('/api/session/status', (req, res) => {
  const { clinicId } = req.query;
  
  if (!clinicId) {
    return res.status(400).json({ error: 'clinicId is required' });
  }

  res.json({ status: getStatus(clinicId) });
});

/**
 * 4. Send Message
 * Called by your main .NET backend or Angular when an appointment is booked.
 */
app.post('/api/message/send', async (req, res) => {
  const { clinicId, phone, message } = req.body;
  
  if (!clinicId || !phone || !message) {
    return res.status(400).json({ error: 'clinicId, phone, and message are required' });
  }

  try {
    const result = await sendMessage(clinicId, phone, message);
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error(`Failed to send message for Clinic ${clinicId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp Microservice running on port ${PORT}`);
  console.log(`Example API: POST http://localhost:${PORT}/api/session/start`);
});
