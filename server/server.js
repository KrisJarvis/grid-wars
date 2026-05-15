const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const STATE_FILE = path.join(__dirname, 'grid_state.json');

function saveState(grid) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(grid));
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Return null if error or file doesn't exist
  }
  return null;
}

app.use(cors());

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// config
const GRID_SIZE = 20; // 20x20 = 400 blocks
const COOLDOWN_MS = 20;
const BLOCK_LOCK_MS = 3000; // block can't be re-captured for 3s
const MAX_ACTIVITY_LOG = 50;

// picked these by hand to be visually distinct on dark bg
const USER_COLORS = [
  '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#FDCB6E',
  '#E84393', '#00CEC9', '#FF7675', '#74B9FF', '#55EFC4',
  '#A29BFE', '#FAB1A0', '#81ECEC', '#DFE6E9', '#FD79A8',
  '#636E72', '#D63031', '#E056C1', '#00B4D8', '#2D6A4F',
  '#F72585', '#B5179E', '#7209B7', '#560BAD', '#480CA8',
  '#3A0CA3', '#3F37C9', '#4361EE', '#4895EF', '#4CC9F0',
];

const ADJECTIVES = [
  'Swift', 'Cosmic', 'Shadow', 'Blazing', 'Neon', 'Phantom',
  'Crystal', 'Thunder', 'Mystic', 'Frozen', 'Golden', 'Cyber',
  'Lunar', 'Solar', 'Turbo', 'Stealth', 'Prism', 'Quantum',
  'Ember', 'Sonic', 'Iron', 'Storm', 'Pixel', 'Nova',
];
const NOUNS = [
  'Fox', 'Hawk', 'Wolf', 'Panda', 'Tiger', 'Phoenix',
  'Dragon', 'Falcon', 'Viper', 'Bear', 'Shark', 'Eagle',
  'Lynx', 'Otter', 'Raven', 'Cobra', 'Jaguar', 'Panther',
  'Owl', 'Lion', 'Stag', 'Crane', 'Mantis', 'Gecko',
];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

// grid state - load from file if exists, otherwise create new
const savedGrid = loadState();
const grid = savedGrid || Array(GRID_SIZE).fill(null).map(() =>
  Array(GRID_SIZE).fill(null)
);

// tracks when each block was last captured (for lock timer)
const blockLocks = Array(GRID_SIZE).fill(null).map(() =>
  Array(GRID_SIZE).fill(0)
);

const users = new Map(); // socketId -> user data
const activityLog = [];
let colorIndex = 0;

function getNextColor() {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

function addActivity(type, data) {
  const entry = { id: crypto.randomUUID(), type, ...data, timestamp: Date.now() };
  activityLog.unshift(entry);
  if (activityLog.length > MAX_ACTIVITY_LOG) {
    activityLog.length = MAX_ACTIVITY_LOG;
  }
  return entry;
}

function getLeaderboard() {
  return Array.from(users.values())
    .map(u => ({ username: u.username, color: u.color, blockCount: u.blockCount }))
    .sort((a, b) => b.blockCount - a.blockCount)
    .slice(0, 10);
}

// lightweight grid snapshot for the wire (don't send internal timestamps etc)
function getGridSnapshot() {
  return grid.map(row =>
    row.map(cell =>
      cell ? { userId: cell.userId, color: cell.color, username: cell.username } : null
    )
  );
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    users: users.size,
    gridSize: GRID_SIZE,
    uptime: process.uptime(),
  });
});

io.on('connection', (socket) => {
  const username = generateUsername();
  const color = getNextColor();

  const userData = {
    id: socket.id,
    username,
    color,
    blockCount: 0,
    lastCaptureTime: 0,
  };
  users.set(socket.id, userData);

  console.log(`${username} connected (${socket.id})`);

  // send everything the client needs to render
  socket.emit('init', {
    grid: getGridSnapshot(),
    userId: socket.id,
    username,
    color,
    gridSize: GRID_SIZE,
    cooldownMs: COOLDOWN_MS,
    blockLockMs: BLOCK_LOCK_MS,
    leaderboard: getLeaderboard(),
    userCount: users.size,
    activity: activityLog.slice(0, 10),
  });

  const joinActivity = addActivity('join', { username, color });
  io.emit('userCount', { count: users.size });
  io.emit('activity', joinActivity);
  io.emit('leaderboard', getLeaderboard());

  socket.on('captureBlock', (data) => {
    const { x, y } = data;
    const user = users.get(socket.id);
    if (!user) return;

    const now = Date.now();

    // bounds check
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      socket.emit('captureError', { message: 'Invalid coordinates' });
      return;
    }

    // cooldown check
    if (now - user.lastCaptureTime < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now - user.lastCaptureTime);
      socket.emit('captureError', { message: `Cooldown! Wait ${remaining}ms`, type: 'cooldown', remaining });
      return;
    }

    // block lock check (prevents rapid back-and-forth fights)
    if (now - blockLocks[x][y] < BLOCK_LOCK_MS) {
      const remaining = BLOCK_LOCK_MS - (now - blockLocks[x][y]);
      socket.emit('captureError', { message: `Block is locked for ${remaining}ms`, type: 'locked', x, y, remaining });
      return;
    }

    // can't recapture your own block
    const existing = grid[x][y];
    if (existing && existing.userId === socket.id) {
      socket.emit('captureError', { message: 'Already yours!', type: 'own' });
      return;
    }

    // if stealing from someone, update their count
    if (existing && existing.userId !== socket.id) {
      const prevOwner = users.get(existing.userId);
      if (prevOwner) {
        prevOwner.blockCount = Math.max(0, prevOwner.blockCount - 1);
      }
    }

    // do the capture
    grid[x][y] = {
      userId: socket.id,
      color: user.color,
      username: user.username,
      capturedAt: now,
    };
    blockLocks[x][y] = now;
    user.blockCount++;
    user.lastCaptureTime = now;

    // tell everyone
    io.emit('blockUpdated', {
      x, y,
      userId: socket.id,
      color: user.color,
      username: user.username,
      prevOwner: existing ? existing.username : null,
    });

    const captureActivity = addActivity('capture', {
      username: user.username,
      color: user.color,
      x, y,
      prevOwner: existing ? existing.username : null,
    });
    io.emit('activity', captureActivity);
    io.emit('leaderboard', getLeaderboard());

    // persist
    saveState(grid);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.username} disconnected`);
      const leaveActivity = addActivity('leave', { username: user.username, color: user.color });
      users.delete(socket.id);
      io.emit('userCount', { count: users.size });
      io.emit('activity', leaveActivity);
      io.emit('leaderboard', getLeaderboard());
      // keep their blocks on the grid (ghost territory)
    }
  });
});

// Catch-all to serve the frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Grid: ${GRID_SIZE}x${GRID_SIZE} (${GRID_SIZE * GRID_SIZE} blocks)`);
  console.log(`Cooldown: ${COOLDOWN_MS}ms | Block lock: ${BLOCK_LOCK_MS}ms`);
});