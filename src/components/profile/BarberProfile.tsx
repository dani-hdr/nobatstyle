'use client'

import { Award, ExternalLink, Star, Store, UserRound, Users } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { faDate } from '@/lib/dashboard-types'

import { BarberPortfolioManager } from './BarberPortfolioManager'
import { BarberServicesPicker } from './BarberServicesPicker'
import { BarberShopSettings } from './BarberShopSettings'
import { InfoRow, ProfileSkeleton } from './CustomerProfile'
import { LogoutButton } from './LogoutButton'
import { ProfileHeaderCard } from './ProfileHeaderCard'
import { useProfileData } from './use-profile-data'

export function BarberProfile() {
  const { data, loading, error, reload } = useProfileData()

  if (loading) return <ProfileSkeleton />
  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="border-input hover:bg-muted mt-4 rounded-lg border px-4 py-2 text-sm"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  const barber = data.barber

  return (
    <div className="space-y-8">
      <ProfileHeaderCard
        user={data.user}
        badge={barber?.isVerified ? <Badge variant="success">تأیید شده</Badge> : undefined}
        subtitle={
          barber?.shopSlug ? (
            <Link
              href={`/barbers/${barber.shopSlug}`}
              className="text-primary mt-1 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
            >
              مشاهده صفحه عمومی آرایشگاه
              <ExternalLink className="size-3.5" />
            </Link>
          ) : undefined
        }
        onUpdated={reload}
      />

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Star className="size-5" />}
          label="امتیاز"
          value={(barber?.rating ?? 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="بازخورد"
          value={(barber?.reviewCount ?? 0).toLocaleString('fa-IR')}
        />
        <StatCard
          icon={<Award className="size-5" />}
          label="سال سابقه"
          value={(barber?.experienceYears ?? 0).toLocaleString('fa-IR')}
        />
        <StatCard
          icon={<Store className="size-5" />}
          label="وضعیت"
          value={barber ? (barber.isActive ? 'فعال' : 'غیرفعال') : 'بدون آرایشگاه'}
        />
      </section>

      <Tabs defaultValue="shop" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="shop">آرایشگاه</TabsTrigger>
          <TabsTrigger value="services">خدمات</TabsTrigger>
          <TabsTrigger value="portfolio">نمونه‌کارها</TabsTrigger>
          <TabsTrigger value="account">حساب کاربری</TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          <BarberShopSettings barber={barber} creating={!barber} onUpdated={reload} />
        </TabsContent>

        <TabsContent value="services">
          {barber ? (
            <BarberServicesPicker
              catalog={data.servicesCatalog ?? []}
              selectedIds={barber.serviceIds}
              onUpdated={reload}
            />
          ) : (
            <EmptyShopHint />
          )}
        </TabsContent>

        <TabsContent value="portfolio">
          {barber ? (
            <BarberPortfolioManager
              barberId={barber.id}
              items={data.portfolio}
              onUpdated={reload}
            />
          ) : (
            <EmptyShopHint />
          )}
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card className="py-0">
            <CardContent className="divide-y px-5 py-2">
              <InfoRow
                icon={<UserRound className="size-4" />}
                label="نام"
                value={data.user.name || '—'}
              />
              <InfoRow
                icon={<Store className="size-4" />}
                label="آرایشگاه"
                value={barber?.shopName || '—'}
              />
              <InfoRow
                icon={<Star className="size-4" />}
                label="عضویت از"
                value={faDate(data.user.createdAt)}
              />
            </CardContent>
          </Card>
          <div className="flex justify-start">
            <LogoutButton />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-4 py-4">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="truncate text-base font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyShopHint() {
  return (
    <Card className="border-dashed py-0">
      <CardContent className="text-muted-foreground px-6 py-10 text-center text-sm">
        ابتدا در تب «آرایشگاه» پروفایل آرایشگاه خود را بسازید.
      </CardContent>
    </Card>
  )
}
