import Image from 'next/image'

import { BarberSearch } from '@/components/home/BarberSearch'
import { Container } from '@/components/layout/Container'
import type { ProvinceGroup } from '@/lib/barber-search'
import type { Home } from '@/payload-types'

const STAT_KEYS = [
  { key: 'barbersCount', label: 'آرایشگر فعال', suffix: '‌+' },
  { key: 'appointmentsCount', label: 'رزرو موفق', suffix: '‌+' },
  { key: 'citiesCount', label: 'شهر تحت پوشش', suffix: '' },
  { key: 'customersCount', label: 'مشتری راضی', suffix: '‌+' },
] as const

export function Hero({
  hero,
  stats,
  cities,
}: {
  hero: Home['hero']
  stats: Home['stats']
  cities: ProvinceGroup[]
}) {
  const image = hero?.image && typeof hero.image !== 'string' ? hero.image : null

  return (
    <section className="bg-gradient-to-b from-primary/[0.04] to-background relative">
      <Container className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20 lg:gap-14">
        <div className="flex flex-col items-end md:items-start gap-3 md:gap-6 relative z-20 text-end md:text-start">
          <span className=" text-yellow-600 inline-flex items-center gap-2 rounded-full  text-sm md:text-3xl font-medium">
            زیبایی وقت میخواهد
          </span>

          <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-5xl lg:text-[3.4rem] ">
            {hero?.title}
          </h1>

          <p className="md:text-muted-foreground max-w-md text-pretty font-medium md:font-normal leading-7 text-sm md:text-lg">
            {hero?.subtitle}
          </p>

          <div className="w-full max-w-md hidden md:block">
            <BarberSearch cities={cities} />
          </div>

          {stats && (
            <dl className="md:mt-2 flex w-full max-w-md flex-wrap justify-end md:justify-start gap-x-8 gap-y-5">
              {STAT_KEYS.filter(({ key }) => stats[key]).map(({ key, label, suffix }) => (
                <div key={key} className="flex flex-col items-center">
                  <dt className="md:text-muted-foreground order-2 text-xs">{label}</dt>
                  <dd className="text-2xl font-bold">
                    {Number(stats[key]).toLocaleString('fa-IR')}
                    {suffix}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="w-full max-w-[90%] mx-auto absolute -bottom-8 z-20 left-0 right-0  md:hidden">
          <BarberSearch cities={cities} />
        </div>
        <div className="absolute left-0 right-0 top-0 bottom-0 md:relative ">
          {image?.url ? (
            <div className="relative aspect-4/3 w-full h-full overflow-hidden md:rounded-3xl">
              <div className='absolute z-10 top-0 bottom-0 w-full bg-linear-to-r from-white  to-transparent md:bg-none'></div>
              <Image
                src={image.url}
                alt={image.alt || hero?.title || 'آرایشگاه'}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-primary/10 flex aspect-[4/3] items-center justify-center rounded-3xl">
              <span className="text-muted-foreground text-sm">تصویری تنظیم نشده است</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
