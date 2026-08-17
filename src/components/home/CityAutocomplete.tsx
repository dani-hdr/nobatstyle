'use client'

import { Check, MapPin } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { ProvinceGroup, SearchCity } from '@/lib/barber-search'
import { cn } from '@/utils/cn'

export function CityAutocomplete({
  cities,
  value,
  onValueChange,
  placeholder = 'انتخاب شهر',
}: {
  cities: ProvinceGroup[]
  value: string
  onValueChange: (cityId: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selected = allCities(cities).find((c) => c.id === value)

  const filtered = cities
    .map((group) => ({
      ...group,
      cities: group.cities.filter((c) => c.name.includes(search.trim())),
    }))
    .filter((group) => group.cities.length > 0)

  const pick = (id: string) => {
    onValueChange(id)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="فیلتر بر اساس شهر"
          className={cn(
            'flex h-9 w-full md:w-fit shrink-0 items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ',
            value ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="size-4 shrink-0" />
            {selected ? selected.name : placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b p-2">
          <Input
            autoFocus
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی شهر..."
            className="h-9"
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          <CityRow
            label="همه شهرها"
            active={value === ''}
            onSelect={() => pick('')}
          />
          {filtered.map((group) => (
            <div key={group.province}>
              <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                {group.label}
              </div>
              {group.cities.map((city) => (
                <CityRow
                  key={city.id}
                  label={city.name}
                  active={value === city.id}
                  onSelect={() => pick(city.id)}
                />
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-muted-foreground p-4 text-center text-sm">
              شهری یافت نشد.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CityRow({
  label,
  active,
  onSelect,
}: {
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      {active && <Check className="size-4 shrink-0" />}
    </button>
  )
}

function allCities(groups: ProvinceGroup[]): SearchCity[] {
  return groups.flatMap((g) => g.cities)
}
