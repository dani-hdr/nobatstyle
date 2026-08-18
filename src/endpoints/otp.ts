import { randomBytes } from 'node:crypto'
import type { Endpoint as PayloadEndpoint } from 'payload'
import { APIError, jwtSign } from 'payload'

import { deliverOtp, generateOtpCode, hashOtpCode, otpTtlMilliseconds } from '../lib/otp'
import { ROLES } from '../utils/constants'
import type { Role } from '../utils/constants'

const AUTH_COLLECTION = 'users'
const ROLE_SLUGS: Role[] = [ROLES.CUSTOMER, ROLES.BARBER]

function isRole(value: unknown): value is Role {
  return ROLE_SLUGS.includes(value as Role)
}

function validPhone(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 8 && /^[+\d][\d\s-]{7,}$/.test(value)
}

/**
 * POST /api/otp/request
 * Generates + "delivers" an OTP (currently hardcoded `1234`) for a customer/
 * barber phone number and stores it hashed with a short expiry. Admins are out
 * of scope — they keep the normal password login.
 */
export const requestOtpEndpoint: PayloadEndpoint = {
  path: '/otp/request',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) ?? {}
    const phone = String(body?.phone ?? '').trim()
    const role = body?.role

    if (!validPhone(phone)) throw new APIError('شماره تماس معتبر نیست.', 400)
    if (!isRole(role)) throw new APIError('نقش معتبر نیست.', 400)
    if (role === ROLES.ADMIN) throw new APIError('ورود مدیر از طریق کد پشتیبانی نمی‌شود.', 403)

    const code = generateOtpCode()
    await deliverOtp(phone, code)

    const expiresAt = new Date(Date.now() + otpTtlMilliseconds())
    await req.payload.create({
      collection: 'otps',
      overrideAccess: true,
      data: {
        phone,
        role,
        code: hashOtpCode(code, req.payload.secret),
        expiresAt: expiresAt.toISOString(),
        used: false,
      },
    })

    return Response.json({ ok: true, expiresAt: expiresAt.toISOString() })
  },
}

/**
 * POST /api/otp/verify
 * Verifies the code against the latest pending OTP for the phone+role, then
 * finds-or-creates the user and issues a signed Payload JWT (the same one the
 * password login uses) plus the `payload-token` cookie, so subsequent requests
 * authenticate as that user via Payload's standard auth.
 */
export const verifyOtpEndpoint: PayloadEndpoint = {
  path: '/otp/verify',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) ?? {}
    const phone = String(body?.phone ?? '').trim()
    const code = String(body?.code ?? '').trim()

    if (!validPhone(phone)) throw new APIError('شماره تماس معتبر نیست.', 400)
    if (!code) throw new APIError('کد وارد نشده است.', 400)

    const { docs: pending } = await req.payload.find({
      collection: 'otps',
      overrideAccess: true,
      where: {
        and: [
          { phone: { equals: phone } },
          { used: { equals: false } },
          { expiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
    })

    const otp = pending[0]
    if (!otp) throw new APIError('کد منقضی شده یا نامعتبر است. دوباره درخواست دهید.', 400)
    if (hashOtpCode(code, req.payload.secret) !== otp.code) {
      throw new APIError('کد یکبارمصرف صحیح نیست.', 400)
    }

    await req.payload.update({
      collection: 'otps',
      overrideAccess: true,
      id: otp.id,
      data: { used: true },
      depth: 0,
    })

    const role: Role = otp.role === ROLES.BARBER ? ROLES.BARBER : ROLES.CUSTOMER

    const { docs: existing } = await req.payload.find({
      collection: AUTH_COLLECTION,
      overrideAccess: true,
      where: { phone: { equals: phone } },
      limit: 1,
      depth: 0,
    })

    let user = existing[0]
    if (user && user.role === ROLES.ADMIN) {
      throw new APIError('مدیران از طریق کد وارد نمی‌شوند. لطفاً از ورود ادمین استفاده کنید.', 403)
    }

    if (!user) {
      const email = `${phone}@otp.local`
      user = await req.payload.create({
        collection: AUTH_COLLECTION,
        overrideAccess: true,
        depth: 0,
        data: {
          name: phone,
          phone,
          role,
          email,
          password: randomBytes(24).toString('hex'),
          isVerified: true,
        },
      })
    }

    user.collection = AUTH_COLLECTION
    const collectionConfig = req.payload.collections[AUTH_COLLECTION].config
    const tokenExpiration = collectionConfig.auth.tokenExpiration
    const fieldsToSign: Record<string, unknown> = {
      id: user.id,
      collection: AUTH_COLLECTION,
      email: typeof user.email === 'string' ? user.email : '',
      role: user.role,
    }

    const { token } = await jwtSign({
      fieldsToSign,
      secret: req.payload.secret,
      tokenExpiration,
    })

    const cookieName = `${req.payload.config.cookiePrefix}-token`
    const secure = req.protocol === 'https:'
    const cookie = [
      `${cookieName}=${token}`,
      'Path=/',
      'HttpOnly',
      `Max-Age=${tokenExpiration}`,
      'SameSite=Lax',
      ...(secure ? ['Secure'] : []),
    ].join('; ')

    const result = Response.json({ token, user })
    result.headers.set('Set-Cookie', cookie)
    return result
  },
}
