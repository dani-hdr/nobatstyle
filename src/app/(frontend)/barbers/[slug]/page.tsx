import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BarberHero } from '@/components/barber/BarberHero'
import { BarberLocation } from '@/components/barber/BarberLocation'
import { BarberPortfolio } from '@/components/barber/BarberPortfolio'
import { BarberReviews } from '@/components/barber/BarberReviews'
import { BarberServices } from '@/components/barber/BarberServices'
import { BarberStats } from '@/components/barber/BarberStats'
import { BookingProvider } from '@/components/barber/booking/booking-context'
import { RelatedBarbers } from '@/components/barber/RelatedBarbers'
import { StickyBookingCta } from '@/components/barber/StickyBookingCta'
import { Container } from '@/components/layout/Container'
import { getBarberProfile, getRelatedBarbers } from '@/lib/barber-profile'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const barber = await getBarberProfile(slug)
  return {
    title: barber ? `${barber.shopName} - ${barber.barberName}` : 'آرایشگر',
    description: barber?.about,
  }
}

export default async function BarberPage({ params }: PageProps) {
  const { slug } = await params

  let barber
  try {
    barber = await getBarberProfile(slug)
  } catch {
    barber = null
  }

  if (!barber) notFound()

  const related = getRelatedBarbers()

  return (
    <Container className="space-y-12 py-6 md:py-10">
      <BookingProvider barber={barber}>
        <BarberHero barber={barber} />
        <BarberStats stats={barber.stats} />
        <BarberServices services={barber.services} />
        <BarberPortfolio images={barber.portfolio} />
        <BarberReviews
          reviews={barber.reviews}
          rating={barber.rating}
          ratingMax={barber.ratingMax}
        />
        <BarberLocation
          address={barber.address}
          region={barber.region}
          coordinates={barber.coordinates}
        />
        <RelatedBarbers barbers={related} />

        <StickyBookingCta barber={barber} />
      </BookingProvider>
    </Container>
  )
}
