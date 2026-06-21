type CacheEnvelope<T> = {
  v: 1
  savedAt: number
  ttlMs: number
  value: T
}

const DB_NAME = 'pm_cache'
const STORE = 'kv'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'))
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export async function idbSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const env: CacheEnvelope<T> = { v: 1, savedAt: Date.now(), ttlMs, value }
    store.put(env, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('indexedDB write failed'))
  })
  db.close()
}

export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  const env = await new Promise<CacheEnvelope<T> | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.get(key)
    req.onerror = () => reject(req.error ?? new Error('indexedDB read failed'))
    req.onsuccess = () => resolve(req.result as CacheEnvelope<T> | undefined)
  })
  db.close()
  if (!env) return null
  if (env.v !== 1) return null
  if (Date.now() - env.savedAt > env.ttlMs) return null
  return env.value
}

export async function idbClear(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME)
    req.onerror = () => reject(req.error ?? new Error('indexedDB delete failed'))
    req.onsuccess = () => resolve()
    // Some browsers fire `onblocked` when other tabs hold connections.
    req.onblocked = () => resolve()
  })
}

