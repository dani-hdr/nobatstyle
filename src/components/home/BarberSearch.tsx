'use client'

import { LoaderCircle, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SearchCity = { id: string; name: string }
type ResultBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  avatar?: ({ url?: string | null; alt?: string | null } | string | null) | null
  city?: ({ id: string; name: string } | string | null) | null
}

export function BarberSearch({ cities }: { cities: SearchCity[] }) {
  const [query, setQuery] = React.useState('')
  const [cityId, setCityId] = React.useState('')
  const [results, setResults] = React.useState<ResultBarber[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const abortRef = React.useRef<AbortController | null>(null)

  const runSearch = React.useCallback(async (q: string, c: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!q.trim() && !c) {
      setResults([])
      setLoading(false)
      setHasSearched(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '8')
      if (q.trim()) params.set('where[shopName][contains]', q.trim())
      if (c) params.set('where[city][equals]', c)
      params.set('depth', '1')

      const res = await fetch(`/api/barbers?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error('search failed')
      const data = await res.json()
      setResults(data.docs ?? [])
      setHasSearched(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setResults([])
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const t = setTimeout(() => void runSearch(query, cityId), 250)
    return () => clearTimeout(t)
  }, [query, cityId, runSearch])

  const hasFilter = query.trim() !== '' || cityId !== ''
  const showList = hasSearched && hasFilter

  return (
    <Command
      shouldFilter={false}
      className="w-full rounded-xl border bg-background/80 shadow-lg backdrop-blur"
    >
      <div className="flex items-center gap-2 p-1.5">
        <div className="relative flex-1">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="جستجوی آرایشگر یا سالن..."
            className="pe-20"
          />
          <Button
            type="button"
            size="sm"
            className="absolute inset-e-1.5 top-1/2 z-10 h-8 -translate-y-1/2"
            disabled={loading}
            onClick={() => void runSearch(query, cityId)}
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            جستجو
          </Button>
        </div>
        <Select
          value={cityId || '__all__'}
          onValueChange={(v) => setCityId(v === '__all__' ? '' : v)}
        >
          <SelectTrigger
            size="sm"
            aria-label="فیلتر بر اساس شهر"
            className="h-10 w-40 shrink-0"
          >
            <SelectValue placeholder="همه شهرها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">همه شهرها</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CommandList aria-hidden={!showList} className={showList ? '' : 'hidden'}>
        {loading && (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            در حال جستجو...
          </div>
        )}

        {!loading && results.length === 0 && (
          <CommandEmpty>نتیجه‌ای یافت نشد.</CommandEmpty>
        )}

        {results.map((barber) => (
          <CommandItem key={barber.id} asChild>
            <Link href={`/barbers/${barber.shopSlug || barber.id}`}>
              <div className="bg-muted relative size-9 shrink-0 overflow-hidden rounded-full">
                {barber.avatar && typeof barber.avatar === 'object' && barber.avatar.url ? (
                  <Image
                    src={barber.avatar.url}
                    alt={barber.avatar.alt || barber.shopName}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
                    {barber.shopName.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{barber.shopName}</span>
                {typeof barber.city === 'object' && barber.city?.name && (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="size-3" />
                    {barber.city.name}
                  </span>
                )}
              </div>

              {barber.rating ? (
                <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                  <Star className="fill-amber-400 size-3.5 text-amber-400" />
                  {barber.rating.toLocaleString('fa-IR')}
                </span>
              ) : null}
            </Link>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
