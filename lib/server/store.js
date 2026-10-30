import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { setStorageAdapter } from '@/lib/storage/adapter';
import { seedProviders, seedListings, seedPortfolio } from '@/lib/storage/seed';
import { SUPABASE_URL } from '@/lib/supabaseProject';

/*
 * Halo's shared data on the server.
 *
 * Every collection (users, providers, listings, bookings...) lives in one of:
 *   1. Supabase, table `halo_records` (one row per record), when
 *      SUPABASE_SECRET_KEY is set (project address: lib/supabaseProject.js);
 *   2. JSON files in .halo-data/ (local development, or until Supabase is set up).
 * The first time it starts with no data, it is filled with Halo's demo seed.
 *
 * Halo's domain functions (lib/domain) still call readStorage/writeStorage; on
 * the server those go through the adapter installed below, which reads this
 * store and takes the session from the signed cookie of the current request.
 */

const SHARED_KEYS = Object.values(STORAGE_KEYS).filter(
  (key) => key !== STORAGE_KEYS.SESSION && key !== STORAGE_KEYS.CHECKOUT_DRAFT
);
// What a brand-new database starts with: the storefronts, their listings and
// portfolio photos only. No made-up people, bookings, reviews, quotes,
// disputes or announcements. The sample storefronts' contact details are
// placeholders, so they start empty; their owner (the admin account, see
// ensureEnvAdmin) fills in real ones.
const STARTING_DATA = {
  [STORAGE_KEYS.USERS]: [],
  [STORAGE_KEYS.PROVIDERS]: seedProviders.map((provider) => ({
    ...provider,
    contact: Object.fromEntries(Object.keys(provider.contact || {}).map((key) => [key, ''])),
  })),
  [STORAGE_KEYS.LISTINGS]: seedListings,
  [STORAGE_KEYS.PORTFOLIO]: seedPortfolio,
  [STORAGE_KEYS.BOOKINGS]: [],
  [STORAGE_KEYS.EVENT_REQUESTS]: [],
  [STORAGE_KEYS.QUOTES]: [],
  [STORAGE_KEYS.REVIEWS]: [],
  [STORAGE_KEYS.DISPUTES]: [],
  [STORAGE_KEYS.ANNOUNCEMENTS]: [],
  [STORAGE_KEYS.PURCHASES]: [],
  [STORAGE_KEYS.SETTINGS]: [],
};
const TABLE = 'halo_records';

const store =
  globalThis.__haloStore ||
  (globalThis.__haloStore = {
    data: new Map(), // key -> array
    snapshot: new Map(), // key -> Map(id -> JSON last read/written)
    ready: false,
    syncing: null,
    queue: Promise.resolve(),
    disabled: false,
    problem: '', // why the database isn't used, if it isn't
  });

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

function databaseConfig() {
  if (store.disabled) return null;
  const url = (process.env.HALO_DB_URL || SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim();
  return url && key.startsWith('sb_secret_') ? { url: url.replace(/\/$/, ''), key } : null;
}

/** Plain-words state of the database, for the status page (no secrets). */
export function databaseStatus() {
  if (store.problem) return store.problem;
  if (!(process.env.SUPABASE_SECRET_KEY || '').trim().startsWith('sb_secret_')) return 'no secret key: set SUPABASE_SECRET_KEY';
  return store.ready ? 'connected' : 'not loaded yet';
}

export function isDatabaseMode() {
  return Boolean(databaseConfig()) && store.ready;
}

function dataDir() {
  if (process.env.HALO_DATA_DIR) return process.env.HALO_DATA_DIR;
  if (process.env.VERCEL) return path.join('/tmp', 'halo-data');
  return path.join(process.cwd(), '.halo-data');
}

function fileFor(key) {
  return path.join(/*turbopackIgnore: true*/ dataDir(), `${key}.json`);
}

async function rest(method, query, body, prefer) {
  const { url, key } = databaseConfig();
  const response = await fetch(`${url}/rest/v1/${TABLE}${query}`, {
    method,
    cache: 'no-store',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Supabase ${method} ${response.status}: ${text.slice(0, 200)}`);
    error.missingTable = text.includes('PGRST205') || text.includes('42P01');
    throw error;
  }
  return method === 'GET' ? response.json() : null;
}

async function loadFromDatabase() {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    const { url, key } = databaseConfig();
    const response = await fetch(`${url}/rest/v1/${TABLE}?select=collection,id,data&order=collection,id`, {
      cache: 'no-store',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${start}-${start + 999}`, 'Range-Unit': 'items' },
    });
    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Supabase GET ${response.status}: ${text.slice(0, 200)}`);
      error.missingTable = text.includes('PGRST205') || text.includes('42P01');
      throw error;
    }
    const page = await response.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  const data = new Map(SHARED_KEYS.map((key) => [key, []]));
  for (const row of rows) {
    if (data.has(row.collection)) data.get(row.collection).push(row.data);
  }
  return { data, empty: rows.length === 0 };
}

function loadFromFiles() {
  const data = new Map();
  let empty = true;
  for (const key of SHARED_KEYS) {
    try {
      const file = fileFor(key);
      if (fs.existsSync(file)) {
        data.set(key, JSON.parse(fs.readFileSync(file, 'utf-8')));
        empty = false;
        continue;
      }
    } catch (error) {
      console.warn(`[halo] Could not read ${key}; starting it from the seed.`, error.message);
    }
    data.set(key, []);
  }
  return { data, empty };
}

function rememberSnapshot(key, list) {
  store.snapshot.set(key, new Map(list.filter((r) => r && r.id !== undefined).map((r) => [String(r.id), JSON.stringify(r)])));
}

/** Loads the latest data (call at the start of every request). */
export async function syncStore() {
  if (store.syncing) return store.syncing;
  store.syncing = (async () => {
    try {
      await store.queue; // never read over our own unsaved changes
      let loaded;
      if (databaseConfig()) {
        try {
          loaded = await loadFromDatabase();
        } catch (error) {
          // Never take the site down over the database: use local files and say why.
          store.disabled = true;
          store.problem = error.missingTable
            ? 'table missing: run supabase/setup.sql'
            : / 40[13]:/.test(error.message)
              ? 'secret key rejected: check SUPABASE_SECRET_KEY'
              : 'database not reachable';
          console.warn(`[halo] Not using Supabase (${store.problem}). Using local files for now.`, error.message);
          loaded = loadFromFiles();
        }
      } else {
        loaded = loadFromFiles();
      }
      store.data = loaded.data;
      for (const [key, list] of store.data) rememberSnapshot(key, list);
      store.ready = true;
      if (loaded.empty) {
        // First start: the storefronts and listings, nothing made up.
        for (const [key, start] of Object.entries(STARTING_DATA)) saveCollection(key, structuredClone(start));
        await store.queue;
        console.log('[halo] Started with the storefront catalogue.');
      }
    } catch (error) {
      console.error('[halo] Could not load data:', error.message);
    } finally {
      store.syncing = null;
    }
  })();
  return store.syncing;
}

/** Waits until every queued change has been saved. */
export async function flushStore() {
  await store.queue;
}

function saveCollection(key, list) {
  store.data.set(key, list);
  if (databaseConfig()) {
    const previous = store.snapshot.get(key) || new Map();
    const next = new Map();
    const upserts = [];
    for (const record of list) {
      if (!record || record.id === undefined) continue;
      const id = String(record.id);
      const json = JSON.stringify(record);
      next.set(id, json);
      if (previous.get(id) !== json) upserts.push({ collection: key, id, data: record, updated_at: new Date().toISOString() });
    }
    const deletes = [...previous.keys()].filter((id) => !next.has(id));
    store.snapshot.set(key, next);
    if (upserts.length === 0 && deletes.length === 0) return { ok: true };
    store.queue = store.queue
      .then(async () => {
        for (let i = 0; i < upserts.length; i += 200) {
          await rest('POST', '?on_conflict=collection,id', upserts.slice(i, i + 200), 'resolution=merge-duplicates,return=minimal');
        }
        if (deletes.length) {
          const ids = deletes.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(',');
          await rest('DELETE', `?collection=eq.${encodeURIComponent(key)}&id=in.(${encodeURIComponent(ids)})`);
        }
      })
      .catch((error) => console.error('[halo] Saving to Supabase failed:', error.message));
    return { ok: true };
  }
  try {
    const file = fileFor(key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = `${file}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(list));
    fs.renameSync(temp, file);
  } catch (error) {
    // Read-only hosting without Supabase: keep the change in memory.
    console.warn(`[halo] Could not save ${key} to disk; kept in memory only.`, error.code || error.message);
  }
  return { ok: true };
}

export function readCollection(key) {
  return structuredClone(store.data.get(key) || []);
}

export function writeCollection(key, list) {
  return saveCollection(key, list);
}

// ---------------------------------------------------------------------------
// Request context: who is asking (from the signed cookie)
// ---------------------------------------------------------------------------

const requestContext = globalThis.__haloRequestContext || (globalThis.__haloRequestContext = new AsyncLocalStorage());

/** Runs fn with `session` as the current session for Halo's domain functions. */
export function runAs(session, fn) {
  return requestContext.run({ session, nextSession: undefined }, fn);
}

/** If domain code signed someone in (e.g. after sign-up), the new session. */
export function sessionChangedTo() {
  return requestContext.getStore()?.nextSession;
}

setStorageAdapter({
  handles(key) {
    return key === STORAGE_KEYS.SESSION || SHARED_KEYS.includes(key) || key === 'halo_seed_version';
  },
  read(key, fallback) {
    if (key === STORAGE_KEYS.SESSION) {
      const session = requestContext.getStore()?.session;
      return { data: session ?? fallback, recovered: false };
    }
    if (key === 'halo_seed_version') return { data: 99, recovered: false };
    return { data: store.data.has(key) ? readCollection(key) : fallback, recovered: false };
  },
  write(key, value) {
    if (key === STORAGE_KEYS.SESSION) {
      const context = requestContext.getStore();
      if (context) context.nextSession = value;
      return { ok: true };
    }
    if (key === 'halo_seed_version') return { ok: true };
    if (!Array.isArray(value)) return { ok: false, error: 'Expected a list' };
    return saveCollection(key, value);
  },
});
