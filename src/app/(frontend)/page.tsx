import { Hero } from '@/components/home/Hero'
import { PopularServices } from '@/components/home/PopularServices'
import { WhyUs } from '@/components/home/WhyUs'
import { getCities } from '@/lib/barber-search'
import { getHomeContent } from '@/lib/home'

export default async function HomePage() {
  const [{ hero, stats, whyUs, popularServices }, cities] = await Promise.all([
    getHomeContent(),
    getCities(),
  ])

  return (
    <>
      <Hero hero={hero} stats={stats} cities={cities} />
      <PopularServices services={popularServices} />
      <WhyUs items={whyUs} />
    </>
  )
}
