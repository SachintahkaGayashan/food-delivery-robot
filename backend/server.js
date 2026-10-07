const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
console.log("LOADED ADMIN:", admin);
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK Initialization (Alternative safe method)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-5b6ed-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.post('/api/robot/command', async (req, res) => {
  const { command } = req.body;
  if (!['FORWARD', 'REVERSE', 'STOP'].includes(command)) {
    return res.status(400).json({ error: 'Invalid command' });
  }

  try {
    await db.ref('robot').update({
      command: command,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });
    res.status(200).json({ status: 'Success', command });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Industrial Gateway running on port ${PORT}`));

// Toggle Ultrasonic Sensor State (ON/OFF)
app.post('/api/robot/ultrasonic', async (req, res) => {
  const { enabled } = req.body; // boolean: true or false

  try {
    await db.ref('robot').update({
      ultrasonicEnabled: Boolean(enabled),
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });
    res.status(200).json({ status: 'Success', ultrasonicEnabled: enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});