import { Hero } from '@/components/home/Hero'
import { PopularServices } from '@/components/home/PopularServices'
import { getCities } from '@/lib/barber-search'
import { getHomeContent } from '@/lib/home'

export default async function HomePage() {
  const [{ hero, stats, popularServices }, cities] = await Promise.all([
    getHomeContent(),
    getCities(),
  ])

  return (
    <>
      <Hero hero={hero} stats={stats} cities={cities} />
      <PopularServices services={popularServices} />
    </>
  )
}
