import { beforeEach } from 'vitest'

function createStorage(): Storage {
  let store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store = new Map()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

const local = createStorage()
const session = createStorage()

Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true })

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: local, configurable: true })
  Object.defineProperty(window, 'sessionStorage', { value: session, configurable: true })
}

beforeEach(() => {
  local.clear()
  session.clear()
})
