import './globals.css'

import { Vazirmatn } from 'next/font/google'

import { Header } from '@/components/layout/Header'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata = {
  description: 'پلتفرم نوبت‌گیری آنلاین آرایشگاه',
  title: {
    default: 'نوبت استایل',
    template: '%s | نوبت استایل',
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <MobileBottomNav />
      </body>
    </html>
  )
}
