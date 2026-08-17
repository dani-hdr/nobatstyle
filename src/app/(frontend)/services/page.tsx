import { Container } from '@/components/layout/Container'
import type { Service } from '@/payload-types'
import config from '@payload-config'
import { Scissors } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'

function getIconUrl(icon: Service['icon']) {
  return typeof icon === 'object' && icon?.url ? icon.url : null
}

export default async function ServicesPage() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'services',
    depth: 1,
    where: { isActive: { equals: true } },
    sort: 'name',
  })

  return (
    <Container className="py-10 md:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">همه خدمات</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {docs.length.toLocaleString('fa-IR')} خدمت ارائه‌شده روی پلتفرم
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="text-muted-foreground border rounded-2xl p-12 text-center text-sm">
          هنوز خدمتی ثبت نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {docs.map((service) => {
            const iconUrl = getIconUrl(service.icon)

            return (
              <Link
                key={service.id}
                href={`/barbers?service=${service.id}`}
                className="hover:bg-accent border bg-background flex flex-col gap-4 rounded-2xl p-4 transition-colors"
              >
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  {iconUrl ? (
                    <Image
                      src={iconUrl}
                      alt={service.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 flex size-full items-center justify-center">
                      <Scissors className="text-primary size-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">{service.name}</h2>
                  {service.description && (
                    <p className="text-muted-foreground text-sm">{service.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Container>
  )
}
