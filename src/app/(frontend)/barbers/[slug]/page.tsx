import { BarberHero } from '@/components/barber/BarberHero'
import { BarberComments } from '@/components/barber/BarberComments'
import { BarberLocation } from '@/components/barber/BarberLocation'
import { BarberServices } from '@/components/barber/BarberServices'
import { BookingProvider } from '@/components/barber/booking/booking-context'
import { StickyBookingCta } from '@/components/barber/StickyBookingCta'
import { Container } from '@/components/layout/Container'
import { getBarberPageData } from '@/lib/barber-profile.server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const barber = await getBarberPageData(slug).then((d) => d?.profile ?? null)
  return {
    title: barber ? `${barber.shopName}${barber.barberName ? ` - ${barber.barberName}` : ''}` : 'آرایشگر',
    description: barber?.about,
  }
}

export default async function BarberPage({ params }: PageProps) {
  const { slug } = await params

  let data
  try {
    data = await getBarberPageData(slug)
  } catch {
    data = null
  }

  if (!data) notFound()

  const barber = data.profile

  return (
    <BookingProvider barber={barber}>
      <Container className="md:space-y-12 px-0 md:px-6 md:py-10 ">
        <BarberHero barber={barber} />
      </Container>

      <Container className="space-y-12 py-6 md:py-10">
        <BarberServices services={barber.services} />
        <BarberComments
          barberId={barber.id}
          comments={barber.comments}
          total={barber.commentsTotal}
          rating={barber.rating}
          reviewCount={barber.reviewCount}
        />
        <BarberLocation
          address={barber.address}
          region={barber.region}
          coordinates={barber.coordinates}
        />


        <StickyBookingCta barber={barber} />
      </Container>
    </BookingProvider>
  )
}
