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

export type FilterService = { id: string; name: string }

export function BarberFilters({
  cities,
  services,
}: {
  cities: ProvinceGroup[]
  services: FilterService[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const city = searchParams.get('city') ?? ''
  const service = searchParams.get('service') ?? ''

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

  return (
    <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
      <InputGroup className="flex-1 md:max-w-sm">
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

      <div className="grid grid-cols-2 gap-3 md:flex items-center">
        <CityAutocomplete
          cities={cities}
          value={city}
          onValueChange={(v) => push({ city: v })}
          placeholder="همه شهرها"
        />

        <Select value={service || '__all__'} onValueChange={(v) => push({ service: v === '__all__' ? '' : v })}>
          <SelectTrigger aria-label="فیلتر خدمت" className="w-full sm:w-44">
            <SelectValue placeholder="همه خدمات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">همه خدمات</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
