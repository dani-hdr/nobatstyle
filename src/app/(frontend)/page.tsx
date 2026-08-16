import { Hero } from '@/components/home/Hero'
import { PopularServices } from '@/components/home/PopularServices'
import { getHomeContent } from '@/lib/home'

export default async function HomePage() {
  const { hero, stats, popularServices } = await getHomeContent()

  return (
    <>
      <Hero hero={hero} stats={stats} />
      <PopularServices services={popularServices} />
    </>
  )
}
