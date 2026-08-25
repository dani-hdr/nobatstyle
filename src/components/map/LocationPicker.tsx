'use client'

/**
 * Interactive location picker backed by Leaflet + OpenStreetMap tiles.
 * Leaflet touches `window` at import time, so the library is imported
 * dynamically inside an effect to stay SSR-safe. Emits `[lng, lat]` pairs
 * (Mongo/Payload point order).
 */

import 'leaflet/dist/leaflet.css'

import { Crosshair, Loader2, MapPin, X } from 'lucide-react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

export type MapPoint = { lat: number; lng: number }

const DEFAULT_CENTER: MapPoint = { lat: 35.6892, lng: 51.389 } // Tehran
const DEFAULT_ZOOM = 11
const PICKED_ZOOM = 15

type LeafletModule = typeof import('leaflet')

function pinIcon(L: LeafletModule) {
  return L.divIcon({
    className: 'nb-map-pin',
    html:
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 24 24" fill="#e11d48" stroke="#ffffff" stroke-width="1.2">' +
      '<path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.7 6.53 12.28 7.02 12.76a.68.68 0 0 0 .96 0c.49-.48 7.02-7.06 7.02-12.76C19.5 5.36 16.14 2 12 2z"/>' +
      '<circle cx="12" cy="9.5" r="3" fill="#ffffff" stroke="none"/></svg>',
    iconSize: [32, 44],
    iconAnchor: [16, 42],
  })
}

function samePoint(a: MapPoint | null, b: MapPoint | null): boolean {
  if (!a || !b) return false
  return Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lng - b.lng) < 1e-9
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: MapPoint | null
  onChange: (point: MapPoint | null) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<{ L: LeafletModule; map: LeafletMap; marker: LeafletMarker | null } | null>(
    null,
  )
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [ready, setReady] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const L = await import('leaflet')
      if (cancelled || !containerRef.current || leafletRef.current) return

      const map = L.map(containerRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: DEFAULT_ZOOM,
      })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      map.on('click', (e) => {
        onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
      })

      leafletRef.current = { L, map, marker: null }
      setReady(true)
    })()

    return () => {
      cancelled = true
      leafletRef.current?.map.remove()
      leafletRef.current = null
    }
  }, [])

  // Keep marker/view in sync with the controlled value.
  useEffect(() => {
    const ctx = leafletRef.current
    if (!ctx || !ready) return
    const { L, map, marker } = ctx

    if (!value) {
      if (marker) {
        map.removeLayer(marker)
        ctx.marker = null
      }
      return
    }

    if (!samePoint(marker ? { lat: marker.getLatLng().lat, lng: marker.getLatLng().lng } : null, value)) {
      const next = L.marker([value.lat, value.lng], {
        icon: pinIcon(L),
        draggable: true,
      })
      next.on('dragend', () => {
        const p = next.getLatLng()
        onChangeRef.current({ lat: p.lat, lng: p.lng })
      })
      if (marker) {
        map.removeLayer(marker)
      }
      next.addTo(map)
      ctx.marker = next
      map.setView([value.lat, value.lng], PICKED_ZOOM)
    }
  }, [value, ready])

  const locateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChangeRef.current({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }

  return (
    <div className="space-y-2">
      <div
        dir="ltr"
        className="border-border relative h-64 w-full overflow-hidden rounded-xl border md:h-72"
      >
        <div ref={containerRef} className="absolute inset-0" />

        <div className="absolute top-2 left-2 z-[500] flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-background/95 h-8 shadow backdrop-blur"
            disabled={!ready || locating}
            onClick={locateMe}
          >
            {locating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Crosshair className="size-3.5" />
            )}
            موقعیت من
          </Button>
          {value && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-background/95 text-destructive shadow backdrop-blur"
              disabled={!ready}
              onClick={() => onChange(null)}
            >
              <X className="size-3.5" />
              حذف
            </Button>
          )}
        </div>
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <MapPin className="size-3.5 shrink-0" />
        روی نقشه کلیک کنید تا موقعیت آرایشگاه مشخص شود؛ می‌توانید نشانگر را جابه‌جا کنید.
      </p>
      {value && (
        <p className="text-muted-foreground font-mono text-xs ltr:text-left rtl:text-right" dir="ltr">
          {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
