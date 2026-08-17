'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { CityAutocomplete } from '@/components/home/CityAutocomplete'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProvinceGroup } from '@/lib/barber-search'

const SORT_OPTIONS = [
  { value: 'rating', label: 'محبوب‌ترین' },
  { value: 'newest', label: 'جدیدترین' },
] as const

export function BarberFilters({ cities }: { cities: ProvinceGroup[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const city = searchParams.get('city') ?? ''
  const province = searchParams.get('province') ?? ''
  const sort = searchParams.get('sort') ?? 'rating'

  const [query, setQuery] = React.useState(q)

  // Keep the input in sync when the URL changes (e.g. back button).
  React.useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const push = React.useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      // Changing any filter resets to the first page.
      params.delete('page')
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const debouncedQuery = React.useMemo(() => query.trim(), [query])
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (debouncedQuery !== q) push({ q: debouncedQuery })
    }, 350)
    return () => clearTimeout(t)
  }, [debouncedQuery, q, push])

  const handleProvince = (v: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === '__all__') {
      params.delete('province')
      params.delete('city')
    } else {
      params.set('province', v)
      params.delete('city')
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
      <InputGroup className="flex-1">
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی آرایشگر یا سالن..."
          className="ps-3"
        />
        <InputGroupAddon align="inline-end">
          <Search />
        </InputGroupAddon>
      </InputGroup>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={province || '__all__'} onValueChange={handleProvince}>
          <SelectTrigger size="sm" aria-label="فیلتر استان" className="h-11 w-full sm:w-44">
            <SelectValue placeholder="همه استان‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">همه استان‌ها</SelectItem>
            {cities.map((group) => (
              <SelectItem key={group.province} value={group.province}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CityAutocomplete
          cities={province ? cities.filter((g) => g.province === province) : cities}
          value={city}
          onValueChange={(v) => push({ city: v })}
          placeholder="همه شهرها"
        />

        <Select
          value={sort}
          onValueChange={(v) => push({ sort: v })}
        >
          <SelectTrigger size="sm" aria-label="مرتب‌سازی" className="h-11 w-full sm:w-36">
            <SelectValue placeholder="مرتب‌سازی" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
