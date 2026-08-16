'use client'

import { ChevronDown, LoaderCircle, MapPin, Search, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { ProvinceGroup, SearchCity } from '@/lib/barber-search'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type ResultBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  avatar?: ({ url?: string | null; alt?: string | null } | string | null) | null
  city?: ({ id: string; name: string } | string | null) | null
}

export function BarberSearch({ cities }: { cities: ProvinceGroup[] }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [cityId, setCityId] = React.useState('')
  const [results, setResults] = React.useState<ResultBarber[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const abortRef = React.useRef<AbortController | null>(null)

  const selectedCity = allCities(cities).find((c) => c.id === cityId)

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
      params.set('limit', '50')
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

  return (
    <>
      {/* Trigger — clicking/focusing opens the search drawer */}
      <div className="flex items-center gap-3 rounded-xl border bg-background/80 p-2 pl-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="جستجو"
          className="shrink-0"
          onClick={() => setOpen(true)}
        >
          <Search className="size-5" />
        </Button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 text-start text-sm text-muted-foreground"
        >
          جستجوی آرایشگر یا سالن...
        </button>
        <span className="bg-muted text-muted-foreground hidden items-center gap-1 rounded-md px-2 py-1 text-xs sm:inline-flex">
          <MapPin className="size-3.5" />
          {selectedCity ? selectedCity.name : 'همه شهرها'}
        </span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[82dvh] gap-0 rounded-t-3xl sm:h-[70dvh]">
          <SheetHeader className="border-b">
            <SheetTitle>جستجوی آرایشگر</SheetTitle>
            <SheetDescription>آرایشگر یا سالن موردنظرت را جستجو کن.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 overflow-hidden p-3">
            {/* Search input + city filter */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Command
                  shouldFilter={false}
                  className="rounded-xl border bg-background"
                >
                  <CommandInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder="جستجوی آرایشگر یا سالن..."
                    className="pe-3"
                  />
                  <CommandList aria-hidden={!hasSearched} className={hasSearched ? '' : 'hidden'}>
                    {loading && (
                      <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin" />
                        در حال جستجو...
                      </div>
                    )}

                    {!loading && results.length === 0 && (
                      <CommandEmpty>نتیجه‌ای یافت نشد.</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </div>

              <Select value={cityId || '__all__'} onValueChange={(v) => setCityId(v === '__all__' ? '' : v)}>
                <SelectTrigger
                  size="sm"
                  aria-label="فیلتر بر اساس شهر"
                  className="h-10 w-full shrink-0 sm:w-56"
                >
                  <SelectValue placeholder="فیلتر شهر" />
                </SelectTrigger>
                <SelectContent className="max-h-[60dvh]">
                  <SelectItem value="__all__">همه شهرها</SelectItem>
                  {cities.map((group) => (
                    <SelectGroup key={group.province}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {!hasFilter ? (
                <p className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
                  شروع به تایپ کن یا شهری را انتخاب کن تا آرایشگرها نمایش داده شوند.
                </p>
              ) : loading ? (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  در حال جستجو...
                </div>
              ) : results.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  هیچ آرایشگری پیدا نشد.
                </p>
              ) : (
                <ul className="divide-y">
                  {results.map((barber) => (
                    <li key={barber.id}>
                      <Link
                        href={`/barbers/${barber.shopSlug || barber.id}`}
                        onClick={() => setOpen(false)}
                        className="hover:bg-accent flex items-center gap-3 rounded-lg p-3 transition-colors"
                      >
                        <BarberItem row={barber} />
                        <ChevronDown className="text-muted-foreground size-4 -rotate-90 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function BarberItem({ row }: { row: ResultBarber }) {
  return (
    <>
      <div className="bg-muted relative size-11 shrink-0 overflow-hidden rounded-full">
        {row.avatar && typeof row.avatar === 'object' && row.avatar.url ? (
          <Image
            src={row.avatar.url}
            alt={row.avatar.alt || row.shopName}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
            {row.shopName.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{row.shopName}</span>
        {typeof row.city === 'object' && row.city?.name && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {row.city.name}
          </span>
        )}
      </div>

      {row.rating ? (
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
          <Star className="fill-amber-400 size-3.5 text-amber-400" />
          {row.rating.toLocaleString('fa-IR')}
        </span>
      ) : null}
    </>
  )
}

function allCities(groups: ProvinceGroup[]): SearchCity[] {
  return groups.flatMap((g) => g.cities)
}
