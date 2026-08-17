import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}) {
  if (totalPages <= 1) return null

  const pages = getPageWindow(currentPage, totalPages)

  return (
    <nav aria-label="صفحه‌بندی" className="mt-10 flex items-center justify-center gap-1.5">
      <Button asChild variant="outline" size="icon-sm" aria-disabled={currentPage <= 1}>
        {currentPage > 1 ? (
          <Link href={buildHref(currentPage - 1)} aria-label="صفحه قبل">
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="opacity-40">
            <ChevronRight className="size-4 rtl:rotate-180" />
          </span>
        )}
      </Button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="text-muted-foreground px-1 text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            asChild
            variant={p === currentPage ? 'default' : 'outline'}
            size="icon-sm"
          >
            <Link
              href={buildHref(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={cn(p !== currentPage && 'hover:bg-muted')}
            >
              {p.toLocaleString('fa-IR')}
            </Link>
          </Button>
        ),
      )}

      <Button asChild variant="outline" size="icon-sm" aria-disabled={currentPage >= totalPages}>
        {currentPage < totalPages ? (
          <Link href={buildHref(currentPage + 1)} aria-label="صفحه بعد">
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="opacity-40">
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </span>
        )}
      </Button>
    </nav>
  )
}

/** Returns a window of page numbers around the current page, with ellipses. */
function getPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return range(1, total)

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
