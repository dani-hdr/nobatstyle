import { createHmac } from 'node:crypto'

const OTP_CODE_LENGTH = 4
const OTP_TTL_SECONDS = 5 * 60

/**
 * Generates a numeric OTP code.
 *
 * TEMP: For now this always returns the hardcoded test code `1234`. Once the
 * real SMS/OTP provider API is wired in, replace this with a random 4-digit
 * code.
 */
export function generateOtpCode(): string {
  return '1234'
}

/**
 * Delivers an OTP code to a phone (via SMS API).
 *
 * TEMP: No provider is configured yet, so this currently only logs the code.
 * When the SMS API is provided, send the code here instead.
 */
export async function deliverOtp(phone: string, code: string): Promise<void> {
  console.log(`[otp] code for ${phone}: ${code}`)
  void code
}

export function otpTtlMilliseconds(): number {
  return OTP_TTL_SECONDS * 1000
}

/**
 * Deterministic, non-reversible hash of a code, peppered with the Payload
 * secret so a stored hash can't be brute-forced without the server secret.
 */
export function hashOtpCode(code: string, secret: string): string {
  return createHmac('sha256', secret).update(code).digest('hex')
}
