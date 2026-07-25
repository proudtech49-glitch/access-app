const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const url = require('url');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'device_states.json');
let persistedStates = {};
try {
  if (fs.existsSync(STATE_FILE)) {
    persistedStates = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load device states', e);
}

function saveStates() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(persistedStates, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

let dashboardClients = [];
// Map of deviceId -> { ws, isIntercepting }
let deviceClients = new Map();
let historicalNotifications = [];

function broadcastToDashboards(data) {
  const payload = JSON.stringify(data);
  dashboardClients.forEach(client => {
    if (client.readyState === 1) client.send(payload);
  });
}

function getDevicesList() {
  const devicesMap = new Map();
  
  // Clean up persisted states for devices that are offline and not intercepting
  for (const id of Object.keys(persistedStates)) {
    const isIntercepting = persistedStates[id];
    if (!isIntercepting && !deviceClients.has(id)) {
      delete persistedStates[id];
    }
  }
  saveStates();

  // Add remaining persisted devices (which are intercepting and potentially offline)
  for (const [id, isIntercepting] of Object.entries(persistedStates)) {
    devicesMap.set(id, { id, isIntercepting, online: false, connectedAt: null });
  }
  
  // Overwrite with actually connected devices (online = true)
  for (const [id, info] of deviceClients.entries()) {
    devicesMap.set(id, { id, isIntercepting: info.isIntercepting, online: true, connectedAt: info.connectedAt || Date.now() });
  }

  return Array.from(devicesMap.values());
}

function broadcastDeviceState() {
  broadcastToDashboards({ type: 'device_state_update', devices: getDevicesList() });
}

wss.on('connection', (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const clientType = parsedUrl.query.clientType;
  const deviceId = parsedUrl.query.deviceId;

  if (clientType === 'device' && deviceId) {
    console.log(`Device connected: ${deviceId}`);
    const isIntercepting = !!persistedStates[deviceId];
    
    // Close old connection if replacing an active one
    if (deviceClients.has(deviceId)) {
        const oldClient = deviceClients.get(deviceId);
        if (oldClient.ws !== ws && oldClient.ws.readyState === 1) {
            oldClient.ws.close();
        }
    }
    
    deviceClients.set(deviceId, { ws, isIntercepting, connectedAt: Date.now() });
    
    // Instantly sync device with its persistent state
    ws.send(JSON.stringify({ command: isIntercepting ? 'START' : 'STOP' }));
    
    broadcastDeviceState();

    ws.on('close', () => {
      console.log(`Device disconnected: ${deviceId}`);
      // Only delete if the current connection in the map is THIS specific ws
      const current = deviceClients.get(deviceId);
      if (current && current.ws === ws) {
        deviceClients.delete(deviceId);
        broadcastDeviceState();
      }
    });

    ws.on('message', (msg) => {
      // Device can ping/pong
    });

  } else {
    // Treat as Dashboard client
    console.log('Dashboard connected');
    dashboardClients.push(ws);
    
    // Send history
    if (historicalNotifications.length > 0) {
      ws.send(JSON.stringify({ type: 'history', data: historicalNotifications }));
    }
    // Send active devices
    ws.send(JSON.stringify({ 
      type: 'device_state_update', 
      devices: getDevicesList() 
    }));

    ws.on('close', () => {
      console.log('Dashboard disconnected');
      dashboardClients = dashboardClients.filter(c => c !== ws);
    });

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'ping') return;
        
        // Handle SET_INTERCEPT from Dashboard
        if (data.type === 'set_intercept' && data.deviceId) {
          const deviceId = data.deviceId;
          const active = !!data.active;
          
          // 1. Persist state
          persistedStates[deviceId] = active;
          saveStates();
          
          // 2. Update connected device if online
          const device = deviceClients.get(deviceId);
          if (device) {
            device.isIntercepting = active;
            if (device.ws.readyState === 1) {
              device.ws.send(JSON.stringify({ command: active ? 'START' : 'STOP' }));
            }
          }
          
          broadcastDeviceState();
        }
      } catch (e) {
        console.error('Invalid message from dashboard', e);
      }
    });
  }
});

app.post('/api/notifications/batch', (req, res) => {
  const notifications = req.body;
  const batch = Array.isArray(notifications) ? notifications : [notifications];
  
  if (batch.length > 0) {
    historicalNotifications.push(...batch);
    if (historicalNotifications.length > 1000) {
      historicalNotifications = historicalNotifications.slice(-1000);
    }
    broadcastToDashboards({ type: 'notifications', data: batch });
  }
  
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="background-color: black; color: #00FF41; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
        <div>
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">[ STATUS: ONLINE ]</h1>
          <p>Cyber Command Center Backend is running.</p>
          <p style="opacity: 0.7; font-size: 0.8rem; margin-top: 2rem;">Note: This is just the API server. Deploy your 'dashboard' folder to Vercel to see the actual UI.</p>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Cyber Command Center Backend running on port ${PORT}`);
});
