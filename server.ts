import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const STORAGE_FILE = path.join(__dirname, 'sync_store.json');

app.use(express.json({ limit: '10mb' }));

// In-memory sync store with persistence to JSON file
interface SyncData {
  code: string;
  updatedAt: number;
  data: any;
}

let syncStore: Record<string, SyncData> = {};

// Load existing data from file if present
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    syncStore = JSON.parse(raw);
    console.log(`[SyncServer] Loaded ${Object.keys(syncStore).length} sync codes.`);
  }
} catch (err) {
  console.warn('[SyncServer] Could not load sync storage file:', err);
}

function saveStore() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(syncStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SyncServer] Error writing to storage file:', err);
  }
}

// Generate unique 7-character alphanumeric code with letters and numbers
const ALPHANUMERIC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generate7CharCode(): string {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 7; i++) {
      code += ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length));
    }
  } while (syncStore[code]);
  return code;
}

// API Routes
app.post('/api/sync/generate', (req, res) => {
  const initialData = req.body?.data || null;
  const code = generate7CharCode();
  
  syncStore[code] = {
    code,
    updatedAt: Date.now(),
    data: initialData
  };
  saveStore();
  
  console.log(`[ZenithServer] Generated new 7-char alphanumeric sync code: ${code}`);
  res.json({ success: true, code, updatedAt: syncStore[code].updatedAt });
});

app.get('/api/sync/:code', (req, res) => {
  const rawCode = (req.params.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (rawCode.length !== 7) {
    return res.status(400).json({ error: 'Sync code must be 7 characters (letters and numbers)' });
  }

  const record = syncStore[rawCode];
  if (!record) {
    return res.status(404).json({ error: 'Sync code not found' });
  }

  res.json({
    success: true,
    code: record.code,
    updatedAt: record.updatedAt,
    data: record.data
  });
});

app.post('/api/sync/:code', (req, res) => {
  const rawCode = (req.params.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (rawCode.length !== 7) {
    return res.status(400).json({ error: 'Sync code must be 7 characters (letters and numbers)' });
  }

  const incomingData = req.body?.data;
  const incomingUpdatedAt = Number(req.body?.updatedAt) || Date.now();

  if (!incomingData) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Update or initialize
  syncStore[rawCode] = {
    code: rawCode,
    updatedAt: incomingUpdatedAt,
    data: incomingData
  };
  saveStore();

  res.json({
    success: true,
    code: rawCode,
    updatedAt: incomingUpdatedAt
  });
});

// Vite Middleware for Dev / Static Files for Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middleware attached.');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Pomodoro Focus server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Failed to start server:', err);
});
