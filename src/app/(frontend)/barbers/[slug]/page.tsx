import { BarberHero } from '@/components/barber/BarberHero'
import { BarberLocation } from '@/components/barber/BarberLocation'
import { BarberReviews } from '@/components/barber/BarberReviews'
import { BarberServices } from '@/components/barber/BarberServices'
import { BookingProvider } from '@/components/barber/booking/booking-context'
import { StickyBookingCta } from '@/components/barber/StickyBookingCta'
import { Container } from '@/components/layout/Container'
import { getBarberProfile, getRelatedBarbers } from '@/lib/barber-profile'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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
    <BookingProvider barber={barber}>
      <Container className="md:space-y-12 px-0 md:px-6 md:py-10 ">
        <BarberHero barber={barber} />
      </Container>

      <Container className="space-y-12 py-6 md:py-10">
        <BarberServices services={barber.services} />
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


        <StickyBookingCta barber={barber} />
      </Container>
    </BookingProvider>
  )
}
