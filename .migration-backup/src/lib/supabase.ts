import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Safe localStorage access - works in all environments
 */
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

/**
 * Mock query builder for offline mode
 * Provides localStorage-backed data persistence (fallback: in-memory)
 */
const createMockQueryBuilder = (table: string) => {
  const getStorageKey = (suffix = '') => `mock_${table}${suffix}`
  const memoryStore: Record<string, any> = {}

  const getRecords = () => {
    const stored = safeStorage.getItem(getStorageKey('_data'))
    return stored ? JSON.parse(stored) : memoryStore[getStorageKey('_data')] || []
  }

  const setRecords = (records: any[]) => {
    const key = getStorageKey('_data')
    safeStorage.setItem(key, JSON.stringify(records))
    memoryStore[key] = records
  }

  return {
    select: (columns = '*') => Promise.resolve({
      data: getRecords(),
      error: null,
      count: null,
      status: 200,
    }),
    insert: (data: any) => {
      const records = getRecords()
      const newRecords = Array.isArray(data) ? data : [data]
      records.push(...newRecords)
      setRecords(records)
      return Promise.resolve({ data: newRecords, error: null, status: 201 })
    },
    update: (data: any) => Promise.resolve({
      data: data,
      error: null,
      status: 200,
    }),
    delete: () => Promise.resolve({
      data: null,
      error: null,
      status: 200,
    }),
    eq: (column: string, value: any) => ({
      select: (columns = '*') => {
        const records = getRecords()
        const filtered = records.filter((r: any) => r[column] === value)
        return Promise.resolve({ data: filtered, error: null, count: filtered.length, status: 200 })
      },
      update: (data: any) => Promise.resolve({ data: data, error: null, status: 200 }),
      delete: () => Promise.resolve({ data: null, error: null, status: 200 }),
      single: () => {
        const records = getRecords()
        const found = records.find((r: any) => r[column] === value)
        return Promise.resolve({ data: found || null, error: null, status: 200 })
      },
    }),
    neq: (column: string, value: any) => ({
      select: () => {
        const records = getRecords()
        const filtered = records.filter((r: any) => r[column] !== value)
        return Promise.resolve({ data: filtered, error: null, count: filtered.length, status: 200 })
      },
    }),
    order: (column: string, options?: { ascending?: boolean }) => ({
      select: () => {
        const records = getRecords()
        const sorted = [...records].sort((a: any, b: any) => {
          const aVal = a[column]
          const bVal = b[column]
          const direction = options?.ascending === false ? -1 : 1
          return (aVal > bVal ? 1 : -1) * direction
        })
        return Promise.resolve({ data: sorted, error: null, count: sorted.length, status: 200 })
      },
    }),
    limit: (count: number) => ({
      select: () => {
        const records = getRecords()
        return Promise.resolve({ data: records.slice(0, count), error: null, count: count, status: 200 })
      },
    }),
    single: () => Promise.resolve({
      data: null,
      error: null,
      status: 200,
    }),
    upsert: (data: any) => {
      const records = getRecords()
      const newRecords = Array.isArray(data) ? data : [data]
      records.push(...newRecords)
      setRecords(records)
      return Promise.resolve({ data: newRecords, error: null, status: 201 })
    },
  }
}

let supabase: any = null

// Initialize Supabase if credentials are available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
  console.log('✅ Supabase initialized with credentials')
} else {
  console.warn('⚠️ Supabase not configured - using offline mode')

  // Mock client for offline mode with localStorage/memory fallback
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
          return Promise.resolve({
            data: { session: user ? { user } : null },
            error: null,
          })
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
