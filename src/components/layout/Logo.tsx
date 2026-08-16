import { Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/utils/cn'

type LogoImage = { url?: string | null; alt?: string | null }

export function Logo({
  siteName = 'نوبت استایل',
  logo,
  className,
}: {
  siteName?: string
  logo?: LogoImage | null
  className?: string
}) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2.5', className)}
      aria-label={`${siteName} - صفحه اصلی`}
    >
      {logo?.url ? (
        <Image
          src={logo.url}
          alt={logo.alt || siteName}
          width={144}
          height={36}
          className="h-9 w-auto object-contain"
        />
      ) : (
        <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Scissors className="size-5" />
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight">{siteName}</span>
        <span className="text-muted-foreground text-[10px] font-medium tracking-wide" dir="ltr">
          Nobat.style
        </span>
      </span>
    </Link>
  )
}
