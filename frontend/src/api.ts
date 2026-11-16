import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'keymarket_token'

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable: the user just stays signed out after a reload
  }
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/** Thin fetch wrapper: JSON in/out, adds the Bearer token, turns error responses into ApiError. */
export const api = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Cannot reach the server. If it was idle, wait a few seconds and try again.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(data.message ?? 'Something went wrong.', response.status, data.errors)
  return data as T
}

/** Loads a GET endpoint when the component mounts or the path changes. */
export const useFetch = <T>(path: string) => {
  // Each result remembers the path it belongs to, so "loading" is derived (a result for another path means
  // loading) and no state has to be set synchronously inside the effect.
  const [result, setResult] = useState<{
    path: string
    data: T | null
    error: string | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    api<T>(path)
      .then((data) => !cancelled && setResult({ path, data, error: null }))
      .catch((e: Error) => !cancelled && setResult({ path, data: null, error: e.message }))
    return () => {
      cancelled = true
    }
  }, [path])

  const ready = result !== null && result.path === path
  // While another path loads, the previous data stays on screen and the error is cleared, as before.
  return { data: result?.data ?? null, error: ready ? result.error : null, loading: !ready }
}
