import type { Endpoint as PayloadEndpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { getBarberIdForUser } from '../lib/barber-user'
import { ROLES } from '../utils/constants'

type ProfileBody = {
  name?: string | null
  avatarId?: string | null
  shop?: {
    shopName?: string
    shopSlug?: string
    cityId?: string | null
    address?: string | null
    phone?: string | null
    about?: string | null
    experienceYears?: number
    coverId?: string | null
    galleryIds?: string[]
    serviceIds?: string[]
  } | null
}

function requireUser(req: { user?: { id: string | number; role?: string } | null }) {
  if (!req.user) throw new APIError('ابتدا وارد حساب کاربری شوید', 401)
  return req.user
}

/** Keeps only sane slug characters; returns null when nothing usable remains. */
function normalizeSlug(input: string): string | null {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length >= 2 ? slug : null
}

async function ensureUniqueSlug(
  payload: PayloadRequest['payload'],
  desired: string,
): Promise<string> {
  let candidate = desired
  for (let i = 0; i < 5; i++) {
    const { docs } = await payload.find({
      collection: 'barbers',
      where: { shopSlug: { equals: candidate } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    if (docs.length === 0) return candidate
    candidate = `${desired}-${i + 2}`
  }
  throw new APIError('شناسه آرایشگاه تکراری است؛ مقدار دیگری وارد کنید', 409)
}

/**
 * GET /api/profile
 * Aggregated profile of the logged-in user. Barbers additionally receive their
 * shop document and the active service catalog.
 */
export const profileGetEndpoint: PayloadEndpoint = {
  path: '/profile',
  method: 'get',
  handler: async (req) => {
    const user = requireUser(req)
    const userId = String(user.id)

    const me = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
      overrideAccess: false,
      req,
    })

    const base = {
      id: me.id,
      name: me.name ?? null,
      username: me.username,
      role: me.role,
      createdAt: me.createdAt,
      avatar:
        me.avatar && typeof me.avatar === 'object'
          ? { id: me.avatar.id, url: me.avatar.url ?? null, alt: me.avatar.alt }
          : null,
    }

    if (me.role !== ROLES.BARBER) {
      return Response.json({ user: base, barber: null })
    }

    const barberId = await getBarberIdForUser(req.payload, userId)

    const [barberDoc, servicesCatalog] = await Promise.all([
      barberId
        ? req.payload.findByID({
            collection: 'barbers',
            id: barberId,
            depth: 1,
            overrideAccess: false,
            req,
          })
        : Promise.resolve(null),
      req.payload.find({
        collection: 'services',
        depth: 0,
        where: { isActive: { equals: true } },
        sort: 'name',
        limit: 200,
        pagination: false,
        overrideAccess: false,
        req,
      }),
    ])

    return Response.json({
      user: base,
      barber: barberDoc
        ? {
            id: barberDoc.id,
            shopName: barberDoc.shopName,
            shopSlug: barberDoc.shopSlug ?? null,
            city:
              barberDoc.city && typeof barberDoc.city === 'object'
                ? { id: barberDoc.city.id, name: barberDoc.city.name }
                : null,
            cityId:
              typeof barberDoc.city === 'object' ? barberDoc.city.id : (barberDoc.city ?? null),
            address: barberDoc.address ?? null,
            phone: barberDoc.phone ?? null,
            about: barberDoc.about ?? null,
            experienceYears: barberDoc.experienceYears ?? 0,
            cover:
              barberDoc.cover && typeof barberDoc.cover === 'object'
                ? {
                    id: barberDoc.cover.id,
                    url: barberDoc.cover.url ?? null,
                    alt: barberDoc.cover.alt,
                  }
                : null,
            gallery: (barberDoc.gallery ?? [])
              .filter(
                (g): g is Exclude<typeof g, string | number> => Boolean(g) && typeof g === 'object',
              )
              .map((g) => ({ id: g.id, url: g.url ?? null, alt: g.alt })),
            serviceIds: (barberDoc.services ?? []).map((s) =>
              typeof s === 'object' ? String(s.id) : String(s),
            ),
            rating: barberDoc.rating ?? 0,
            reviewCount: barberDoc.reviewCount ?? 0,
          }
        : null,
      servicesCatalog: servicesCatalog.docs.map((s) => ({ id: s.id, name: s.name })),
    })
  },
}

/**
 * PATCH /api/profile
 * Updates the logged-in user's own account and — for barbers — their shop.
 * Only whitelisted fields are accepted; role/username/phone can't be changed here.
 */
export const profileUpdateEndpoint: PayloadEndpoint = {
  path: '/profile',
  method: 'patch',
  handler: async (req) => {
    const user = requireUser(req)
    const userId = String(user.id)

    let body: ProfileBody
    try {
      body = (await req.json?.()) as ProfileBody
    } catch {
      throw new APIError('درخواست نامعتبر است', 400)
    }

    // ---- account fields ----
    const userData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (name.length > 60) throw new APIError('نام نمی‌تواند بیش از ۶۰ نویسه باشد', 400)
      userData.name = name || null
    }
    if (body.avatarId !== undefined) {
      userData.avatar = body.avatarId || null
    }
    if (Object.keys(userData).length > 0) {
      await req.payload.update({
        collection: 'users',
        id: userId,
        data: userData,
        overrideAccess: true,
        req,
      })
    }

    // ---- barber shop fields ----
    const shop = body.shop
    if (shop) {
      const me = await req.payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
        req,
      })
      if (me.role !== ROLES.BARBER && me.role !== ROLES.ADMIN) {
        throw new APIError('فقط آرایشگرها می‌توانند اطلاعات آرایشگاه را ویرایش کنند', 403)
      }

      const barberData: Record<string, unknown> = {}
      if (shop.shopName !== undefined) {
        const shopName = shop.shopName.trim()
        if (!shopName) throw new APIError('نام آرایشگاه الزامی است', 400)
        barberData.shopName = shopName
      }
      if (shop.cityId !== undefined) barberData.city = shop.cityId || null
      if (shop.address !== undefined) barberData.address = shop.address?.trim() || null
      if (shop.phone !== undefined) barberData.phone = shop.phone?.trim() || null
      if (shop.about !== undefined) barberData.about = shop.about?.trim() || null
      if (shop.experienceYears !== undefined) {
        const years = Number(shop.experienceYears)
        if (!Number.isFinite(years) || years < 0 || years > 80) {
          throw new APIError('سابقه کاری معتبر نیست', 400)
        }
        barberData.experienceYears = Math.floor(years)
      }
      if (shop.coverId !== undefined) barberData.cover = shop.coverId || null
      if (shop.galleryIds !== undefined) {
        barberData.gallery = (shop.galleryIds ?? []).filter(Boolean).slice(0, 30)
      }
      if (shop.serviceIds !== undefined) {
        barberData.services = (shop.serviceIds ?? []).filter(Boolean)
      }

      const existingBarberId = await getBarberIdForUser(req.payload, userId)
      if (existingBarberId) {
        await req.payload.update({
          collection: 'barbers',
          id: existingBarberId,
          data: barberData,
          overrideAccess: true,
          req,
        })
      } else {
        // First save: the barbers collection requires a name, city and slug.
        const shopName = String(barberData.shopName ?? '').trim()
        const cityId = barberData.city ? String(barberData.city) : ''
        if (!shopName || !cityId) {
          throw new APIError('برای ساخت پروفایل آرایشگاه، نام آرایشگاه و شهر الزامی است', 400)
        }
        const normalized =
          normalizeSlug(shop.shopSlug || '') ??
          normalizeSlug(shopName) ??
          `shop-${Date.now().toString(36)}`
        barberData.shopSlug = await ensureUniqueSlug(req.payload, normalized)
        barberData.user = userId
        await req.payload.create({
          collection: 'barbers',
          data: barberData as never,
          overrideAccess: true,
          req,
        })
      }
    }

    return Response.json({ ok: true })
  },
}

/**
 * POST /api/profile/avatar
 * Accepts a multipart image upload (parsed by Payload into `req.file`),
 * stores it in `media` and assigns it as the current user's avatar.
 */
export const profileAvatarEndpoint: PayloadEndpoint = {
  path: '/profile/avatar',
  method: 'post',
  handler: async (req) => {
    const user = requireUser(req)
    const file: PayloadRequest['file'] = req.file
    if (!file) throw new APIError('فایلی ارسال نشده است', 400)

    const media = await req.payload.create({
      collection: 'media',
      data: { alt: file.name || 'تصویر پروفایل' },
      file,
      overrideAccess: true,
      req,
    })

    await req.payload.update({
      collection: 'users',
      id: String(user.id),
      data: { avatar: media.id },
      overrideAccess: true,
      req,
    })

    return Response.json({
      ok: true,
      avatar: { id: media.id, url: media.url ?? null, alt: media.alt },
    })
  },
}
