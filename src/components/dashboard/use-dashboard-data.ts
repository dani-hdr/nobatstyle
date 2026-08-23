'use client'

import { useCallback, useEffect, useState } from 'react'

export function useDashboardData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('request failed')
      setData((await res.json()) as T)
    } catch {
      setError('خطا در دریافت اطلاعات؛ دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
