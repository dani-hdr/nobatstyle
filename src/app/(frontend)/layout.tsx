import './globals.css'

import { Vazirmatn } from 'next/font/google'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { getSiteInfo } from '@/lib/site'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export async function generateMetadata() {
  const siteInfo = await getSiteInfo()
  return {
    description: 'پلتفرم نوبت‌گیری آنلاین آرایشگاه',
    title: {
      default: siteInfo.siteName,
      template: `%s | ${siteInfo.siteName}`,
    },
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const siteInfo = await getSiteInfo()

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="flex min-h-dvh flex-col">
        <Header siteName={siteInfo.siteName} logo={siteInfo.logo} items={siteInfo.navLinks} />

        <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>

        <Footer siteName={siteInfo.siteName} quickLinks={siteInfo.navLinks} />

        <MobileBottomNav />
      </body>
    </html>
  )
}
