import PouchDB from 'pouchdb-browser';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt) {
  const base = Math.min(30_000, 500 * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

export function createLocalPouch({ name = 'isms_local' } = {}) {
  return new PouchDB(name);
}

export function createRemoteCouch({ url, username, password } = {}) {
  const opts = {};
  if (username && password) {
    opts.auth = { username, password };
  }
  return new PouchDB(url, opts);
}

export function startLiveSync({
  localDb,
  remoteDb,
  isOnline = () => navigator.onLine,
  onStatus = () => {}
}) {
  let cancelled = false;
  let syncHandler = null;

  async function loop() {
    let attempt = 0;
    while (!cancelled) {
      if (!isOnline()) {
        onStatus({ state: 'offline' });
        await sleep(2000);
        continue;
      }

      try {
        onStatus({ state: 'syncing' });
        syncHandler = localDb.sync(remoteDb, {
          live: true,
          retry: true,
          batch_size: 50,
          batches_limit: 2
        })
          .on('change', (info) => onStatus({ state: 'change', info }))
          .on('paused', () => onStatus({ state: 'idle' }))
          .on('active', () => onStatus({ state: 'syncing' }))
          .on('denied', (err) => onStatus({ state: 'denied', err }))
          .on('error', (err) => onStatus({ state: 'error', err }));

        // Keep loop alive while sync handler is running.
        while (!cancelled && syncHandler) await sleep(5000);
      } catch (err) {
        attempt += 1;
        const wait = backoffMs(attempt);
        onStatus({ state: 'error', err, wait });
        await sleep(wait);
      }
    }
  }

  loop();

  return {
    stop() {
      cancelled = true;
      try {
        syncHandler?.cancel?.();
      } finally {
        syncHandler = null;
      }
    }
  };
}

