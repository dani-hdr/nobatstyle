import { Scissors } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utils/cn'

/**
 * Brand logo placeholder for Nobat.style.
 * Replace the inner mark/wordmark with the real brand asset once it ships.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2.5', className)}
      aria-label="نوبت‌استایل - صفحه اصلی"
    >
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
        <Scissors className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">نوبت استایل</span>
        <span className="text-muted-foreground text-[10px] font-medium tracking-wide" dir="ltr">
          Nobat.style
        </span>
      </span>
    </Link>
  )
}
