'use client'

import { ArrowLeft, LoaderCircle, MapPin, Search, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { CityAutocomplete } from '@/components/home/CityAutocomplete'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { ProvinceGroup, SearchCity } from '@/lib/barber-search'
import { getStoredCityId, setStoredCityId } from '@/lib/city-storage'

type ResultBarber = {
  id: string
  shopName: string
  shopSlug?: string | null
  rating?: number | null
  avatar?: ({ url?: string | null; alt?: string | null } | string | null) | null
  city?: ({ id: string; name: string } | string | null) | null
}

type BarberSearchProps = {
  cities: ProvinceGroup[]
  /** Custom element that opens the search on interaction. Defaults to a search bar. */
  trigger?: React.ReactNode
}

export function BarberSearch({ cities, trigger }: BarberSearchProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)') ?? true

  const content = (
    <BarberSearchContent
      cities={cities}
      onSelect={() => setOpen(false)}
    />
  )

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <TriggerBar open={setOpen} cities={cities} />
      )}

      {/* Desktop opens a modal dialog; mobile opens a bottom sheet. */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl gap-4 p-5">
            <DialogHeader>
              <DialogTitle>جستجوی آرایشگر</DialogTitle>
              <DialogDescription>
                آرایشگر یا سالن موردنظرت را جستجو کن، یا از میان شهرها فیلتر کن.
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[85dvh] gap-0 rounded-t-3xl">
            <SheetHeader className="border-b">
              <SheetTitle>جستجوی آرایشگر</SheetTitle>
              <SheetDescription>آرایشگر یا سالن موردنظرت را جستجو کن.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {content}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

function TriggerBar({ cities, open }: { cities: ProvinceGroup[]; open: (v: boolean) => void }) {
  const [storedCityId] = React.useState(getStoredCityId)
  const city = allCities(cities).find((c) => c.id === storedCityId)

  return (
    <div className="bg-background/80 flex items-center gap-3 rounded-xl border p-2 pl-3 shadow-lg backdrop-blur">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="جستجو"
        className="shrink-0"
        onClick={() => open(true)}
      >
        <Search className="size-5" />
      </Button>
      <button
        type="button"
        onClick={() => open(true)}
        className="text-muted-foreground flex-1 text-start text-sm"
      >
        جستجوی آرایشگر یا سالن...
      </button>
      {city && (
        <span className="bg-muted text-muted-foreground hidden items-center gap-1 rounded-md px-2 py-1 text-xs sm:inline-flex">
          <MapPin className="size-3.5" />
          {city.name}
        </span>
      )}
    </div>
  )
}

function BarberSearchContent({
  cities,
  onSelect,
}: {
  cities: ProvinceGroup[]
  onSelect: () => void
}) {
  const [query, setQuery] = React.useState('')
  const [cityId, setCityId] = React.useState(() => getStoredCityId())
  const [results, setResults] = React.useState<ResultBarber[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const abortRef = React.useRef<AbortController | null>(null)

  const changeCity = (v: string) => {
    const next = v === '__all__' ? '' : v
    setCityId(next)
    setStoredCityId(next)
  }

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
  const searchParams = new URLSearchParams()
  if (query.trim()) searchParams.set('q', query.trim())
  if (cityId) searchParams.set('city', cityId)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-0">
      {/* Search field + city filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="flex-1">
          <InputGroupInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی آرایشگر یا سالن..."
            className="ps-3"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="جستجو" onClick={() => void runSearch(query, cityId)}>
              <Search />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <CityAutocomplete
          cities={cities}
          value={cityId}
          onValueChange={changeCity}
          placeholder="فیلتر شهر"
        />
      </div>

      {/* No filter yet */}
      {!hasFilter && (
        <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-center text-sm">
          شروع به تایپ کن یا شهری را انتخاب کن تا آرایشگرها نمایش داده شوند.
        </div>
      )}

      {/* Loading */}
      {hasFilter && loading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
          <LoaderCircle className="size-4 animate-spin" />
          در حال جستجو...
        </div>
      )}

      {/* Results */}
      {hasFilter && !loading && (
        <>
          <div className="flex-1 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                هیچ آرایشگری پیدا نشد.
              </p>
            ) : (
              <ul className="divide-y">
                {results.slice(0, 2).map((barber) => (
                  <li key={barber.id}>
                    <Link
                      href={`/barbers/${barber.shopSlug || barber.id}`}
                      onClick={onSelect}
                      className="hover:bg-accent flex items-center gap-3 rounded-lg p-3 transition-colors"
                    >
                      <BarberItem row={barber} />
                      <ArrowLeft className="text-muted-foreground size-4 shrink-0 rtl:rotate-180" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* See all when more than 2 results */}
          {results.length > 2 && (
            <div className="border-t pt-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/barbers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}>
                  مشاهده همه {results.length} نتیجه
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
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
