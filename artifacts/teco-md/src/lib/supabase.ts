import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const safeStorage = {
  getItem: (key: string) => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
      }
    } catch {
      console.warn('localStorage not available')
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch {
      console.warn('localStorage not available')
    }
  },
}

const createMockQueryBuilder = (table: string) => {
  const getStorageKey = () => `mock_${table}_data`
  const memoryStore: Record<string, any[]> = {}

  const getRecords = (): any[] => {
    const stored = safeStorage.getItem(getStorageKey())
    if (stored) {
      try { return JSON.parse(stored) } catch { return [] }
    }
    return memoryStore[getStorageKey()] || []
  }

  const setRecords = (records: any[]) => {
    const key = getStorageKey()
    try { safeStorage.setItem(key, JSON.stringify(records)) } catch {}
    memoryStore[key] = records
  }

  const makeChainable = (records: any[], count?: number | null) => {
    const result = {
      data: records,
      error: null,
      count: count ?? records.length,
      status: 200,
      // Chainable methods that all return a thenable
      order: (column: string, options?: { ascending?: boolean }) => {
        const sorted = [...records].sort((a: any, b: any) => {
          const aVal = a[column]; const bVal = b[column]
          const dir = options?.ascending === false ? -1 : 1
          return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * dir
        })
        return makeChainable(sorted, count)
      },
      limit: (n: number) => makeChainable(records.slice(0, n), n),
      eq: (column: string, value: any) => makeChainable(records.filter((r: any) => r[column] === value)),
      neq: (column: string, value: any) => makeChainable(records.filter((r: any) => r[column] !== value)),
      select: (_cols = '*') => makeChainable(records, count),
      single: () => Promise.resolve({ data: records[0] || null, error: null, status: 200 }),
      then: (resolve: any, reject: any) => Promise.resolve({ data: records, error: null, count: count ?? records.length, status: 200 }).then(resolve, reject),
    }
    return result
  }

  const builder = {
    select: (_cols = '*', opts?: { count?: string; head?: boolean }) => {
      const records = getRecords()
      if (opts?.head) {
        return makeChainable([], records.length)
      }
      return makeChainable(records)
    },
    insert: (data: any) => {
      const records = getRecords()
      const newRecords = Array.isArray(data) ? data : [data]
      setRecords([...records, ...newRecords])
      return Promise.resolve({ data: newRecords, error: null, status: 201 })
    },
    update: (data: any) => {
      return {
        eq: (column: string, value: any) => {
          const records = getRecords()
          const updated = records.map((r: any) => r[column] === value ? { ...r, ...data } : r)
          setRecords(updated)
          return Promise.resolve({ data: updated.filter((r: any) => r[column] === value), error: null, status: 200 })
        },
        neq: (column: string, value: any) => {
          const records = getRecords()
          const updated = records.map((r: any) => r[column] !== value ? { ...r, ...data } : r)
          setRecords(updated)
          return Promise.resolve({ data: updated, error: null, status: 200 })
        },
      }
    },
    delete: () => {
      return {
        eq: (column: string, value: any) => {
          const records = getRecords()
          setRecords(records.filter((r: any) => r[column] !== value))
          return Promise.resolve({ data: null, error: null, status: 200 })
        },
        neq: (column: string, value: any) => {
          const records = getRecords()
          setRecords(records.filter((r: any) => r[column] === value))
          return Promise.resolve({ data: null, error: null, status: 200 })
        },
      }
    },
    upsert: (data: any) => {
      const records = getRecords()
      const items = Array.isArray(data) ? data : [data]
      const updated = [...records]
      for (const item of items) {
        const idx = updated.findIndex((r: any) => r.id === item.id)
        if (idx >= 0) updated[idx] = { ...updated[idx], ...item }
        else updated.push(item)
      }
      setRecords(updated)
      return Promise.resolve({ data: items, error: null, status: 201 })
    },
  }

  return builder
}

let supabase: any = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('✅ Supabase initialized with credentials')
} else {
  console.warn('⚠️ Supabase not configured - using offline mode with localStorage')

  supabase = {
    from: (table: string) => createMockQueryBuilder(table),
    auth: {
      onAuthStateChange: (callback: any) => {
        try {
          const userStr = safeStorage.getItem('mock_user')
          const user = userStr ? JSON.parse(userStr) : null
          callback('INITIAL_SESSION', { session: user ? { user } : null })
        } catch {
          callback('INITIAL_SESSION', { session: null })
        }
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      getSession: () => {
        try {
          const userStr = safeStorage.getItem('mock_user')
          const user = userStr ? JSON.parse(userStr) : null
          return Promise.resolve({ data: { session: user ? { user } : null }, error: null })
        } catch {
          return Promise.resolve({ data: { session: null }, error: null })
        }
      },
      signUp: (credentials: any) => {
        try {
          const user = { id: Date.now().toString(), email: credentials.email }
          safeStorage.setItem('mock_user', JSON.stringify(user))
          return Promise.resolve({ data: { user }, error: null })
        } catch (error) {
          return Promise.resolve({ data: null, error })
        }
      },
      signInWithPassword: (credentials: any) => {
        try {
          const user = { id: '1', email: credentials.email }
          safeStorage.setItem('mock_user', JSON.stringify(user))
          return Promise.resolve({ data: { user }, error: null })
        } catch (error) {
          return Promise.resolve({ data: null, error })
        }
      },
      signOut: () => {
        try {
          safeStorage.removeItem('mock_user')
          return Promise.resolve({ error: null })
        } catch (error) {
          return Promise.resolve({ error })
        }
      },
    },
  }
}

export { supabase }
