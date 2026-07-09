// Orchid Heights Society - Shared Database & Sync Logic

// 1. Database Initialization & LocalStorage Wrappers
const DEFAULT_ADMIN_PASSWORD = 'Admin123';
const DEFAULT_MEMBER_PASSWORD = 'Admin123';

// Generate 96 flats (A-101 to A-1204 and B-101 to B-1204)
function generateDefaultFlats() {
  const flats = {};
  ['A', 'B'].forEach(wing => {
    for (let floor = 1; floor <= 12; floor++) {
      for (let block = 1; block <= 4; block++) {
        const flatNo = `${wing}-${floor * 100 + block}`;
        flats[flatNo] = {
          flatNo: flatNo,
          password: DEFAULT_MEMBER_PASSWORD,
          isPasswordChanged: false,
          members: [
            { name: `Owner ${flatNo}`, mobile: `98765${wing === 'A' ? '1' : '2'}${floor.toString().padStart(2, '0')}${block}`, active: true },
            { name: '', mobile: '', active: false },
            { name: '', mobile: '', active: false }
          ]
        };
      }
    }
  });
  return flats;
}

// Initialize LocalStorage Data
if (!localStorage.getItem('orchid_flats')) {
  localStorage.setItem('orchid_flats', JSON.stringify(generateDefaultFlats()));
}
if (!localStorage.getItem('orchid_visitors')) {
  localStorage.setItem('orchid_visitors', JSON.stringify([]));
}
if (!localStorage.getItem('orchid_contacts')) {
  // Add some default contacts
  const defaultContacts = [
    { id: 1, category: 'સીક્યોરીટી (Security)', name: 'રામસિંહ ભાઈ', mobile: '9988776655' },
    { id: 2, category: 'પ્લમ્બર (Plumber)', name: 'મગનભાઈ પ્લમ્બર', mobile: '9825012345' },
    { id: 3, category: 'દુધવાળા (Milkman)', name: 'ગોપાલ ડેરી', mobile: '9879054321' },
    { id: 4, category: 'ગાડી સાફ કરવા વાળા (Car Cleaner)', name: 'રાજુભાઈ', mobile: '9012345678' },
    { id: 5, category: 'રસોઇ કરવા વાળા બેન (Cook)', name: 'ગીતાબેન', mobile: '9426098765' },
    { id: 6, category: 'ઇલેક્ટ્રિશિયન (Electrician)', name: 'ભાવેશભાઈ', mobile: '9898011223' },
    { id: 7, category: 'લીફ્ટ મેન્ટેનન્શ (Lift Service)', name: 'ઓટીસ લીફ્ટ કેર', mobile: '1800120120' }
  ];
  localStorage.setItem('orchid_contacts', JSON.stringify(defaultContacts));
}
if (!localStorage.getItem('orchid_admin_password')) {
  localStorage.setItem('orchid_admin_password', DEFAULT_ADMIN_PASSWORD);
}

// DB Helpers
const DB = {
  getFlats() {
    return JSON.parse(localStorage.getItem('orchid_flats'));
  },
  saveFlats(flats) {
    localStorage.setItem('orchid_flats', JSON.stringify(flats));
    this.notifyUpdate();
  },
  getVisitors() {
    return JSON.parse(localStorage.getItem('orchid_visitors'));
  },
  saveVisitors(visitors) {
    localStorage.setItem('orchid_visitors', JSON.stringify(visitors));
    this.notifyUpdate();
  },
  addVisitor(visitor) {
    const visitors = this.getVisitors();
    visitors.unshift(visitor); // Add to beginning
    this.saveVisitors(visitors);
  },
  getContacts() {
    return JSON.parse(localStorage.getItem('orchid_contacts'));
  },
  saveContacts(contacts) {
    localStorage.setItem('orchid_contacts', JSON.stringify(contacts));
    this.notifyUpdate();
  },
  getAdminPassword() {
    return localStorage.getItem('orchid_admin_password') || DEFAULT_ADMIN_PASSWORD;
  },
  setAdminPassword(newPassword) {
    localStorage.setItem('orchid_admin_password', newPassword);
  },
  notifyUpdate() {
    // Send standard localStorage update event for other tabs to listen
    window.dispatchEvent(new Event('storage'));
  }
};

// 2. Web Audio API Ringtone Generator
class OrchidRingtone {
  constructor() {
    this.audioCtx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.modulator = null;
    this.isPlaying = false;
    this.intervalId = null;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = () => {
        if (!this.isPlaying) return;
        
        // Create nodes
        this.osc1 = this.audioCtx.createOscillator();
        this.osc2 = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();
        this.modulator = this.audioCtx.createOscillator();
        const modGain = this.audioCtx.createGain();

        // Phone ring effect frequencies (440Hz + 480Hz warble)
        this.osc1.type = 'sine';
        this.osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);

        this.osc2.type = 'sine';
        this.osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

        this.modulator.frequency.value = 20; // 20Hz warbling speed
        modGain.gain.value = 25; // depth

        // Connections
        this.modulator.connect(modGain);
        modGain.connect(this.osc1.frequency);
        modGain.connect(this.osc2.frequency);

        this.osc1.connect(this.gainNode);
        this.osc2.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        // Volume Envelope (loud ring)
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
        this.gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime + 1.2);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.5);

        // Start playing
        this.modulator.start();
        this.osc1.start();
        this.osc2.start();

        // Stop oscillators after 1.5 seconds
        const stopTime = this.audioCtx.currentTime + 1.5;
        this.modulator.stop(stopTime);
        this.osc1.stop(stopTime);
        this.osc2.stop(stopTime);
      };

      // Play immediately and repeat every 2.5 seconds
      playTone();
      this.intervalId = setInterval(playTone, 2500);

    } catch (e) {
      console.error('AudioContext is not supported or blocked by browser gesture rules:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

const ringtone = new OrchidRingtone();

// 3. Real-Time BroadcastChannel Synchronization
const syncChannel = new BroadcastChannel('orchid_heights_sync');

// Socket.io & WebSocket Setup
let socket = null;
let ws = null;
const defaultBackend = 'https://orchidmember.onrender.com';
const customBackendUrl = localStorage.getItem('orchid_backend_url') || defaultBackend;

// PieSocket public channel based on unique name
const PUBLIC_WS_URL = 'wss://demo.piesocket.com/v3/orchid_heights_society_96flats?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV';

function connectPublicWS() {
  console.log(`[WS] Connecting to public relay: ${PUBLIC_WS_URL}`);
  ws = new WebSocket(PUBLIC_WS_URL);
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg && msg.type) {
        OrchidSync.triggerListeners(msg.type, msg.data, 'ws');
      }
    } catch (e) {
      // Ignored
    }
  };
  
  ws.onclose = () => {
    console.log('[WS] Connection closed. Reconnecting in 3s...');
    setTimeout(connectPublicWS, 3000);
  };
}

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (typeof io !== 'undefined' && (customBackendUrl !== defaultBackend || isLocalhost)) {
  // Connect via Socket.io
  const serverUrl = isLocalhost ? 'http://localhost:3000' : customBackendUrl;
  console.log(`[Socket.io] Connecting to: ${serverUrl}`);
  socket = io(serverUrl, { transports: ['websocket'] });
} else {
  // Connect via raw WebSocket
  connectPublicWS();
}

const OrchidSync = {
  channel: syncChannel,
  listeners: [],

  // Send message to all tabs and remote server
  send(type, data) {
    const message = { type, data, senderId: Math.random().toString(36).substring(7) };
    
    // Broadcast locally
    this.channel.postMessage(message);
    
    // Broadcast remotely via Socket.io
    if (socket && socket.connected) {
      socket.emit(type, data);
    }
    
    // Broadcast remotely via raw WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
    
    this.triggerListeners(type, data, message.senderId);
  },

  // Subscribe to messages
  on(type, callback) {
    this.listeners.push({ type, callback });
  },

  triggerListeners(type, data, senderId) {
    this.listeners.forEach(listener => {
      if (listener.type === type || listener.type === '*') {
        listener.callback(data, senderId);
      }
    });
  }
};

// Listen on BroadcastChannel
syncChannel.onmessage = (event) => {
  const { type, data, senderId } = event.data;
  OrchidSync.triggerListeners(type, data, senderId);
};

// Forward remote socket events to local listeners
if (socket) {
  socket.on('VISITOR_REQUEST', (data) => {
    OrchidSync.triggerListeners('VISITOR_REQUEST', data, 'socket');
  });
  socket.on('VISITOR_RESPONSE', (data) => {
    OrchidSync.triggerListeners('VISITOR_RESPONSE', data, 'socket');
  });
  socket.on('ALARM_STOP', (data) => {
    OrchidSync.triggerListeners('ALARM_STOP', data, 'socket');
  });
  socket.on('FLAT_SELECTED_BY_SECURITY', (data) => {
    OrchidSync.triggerListeners('FLAT_SELECTED_BY_SECURITY', data, 'socket');
  });
}

// Expose elements globally
window.DB = DB;
window.ringtone = ringtone;
window.OrchidSync = OrchidSync;
