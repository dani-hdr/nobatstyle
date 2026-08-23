'use client'

import { Loader2, Phone, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'مشتری' },
  { value: 'barber', label: 'آرایشگر' },
] as const

type Role = (typeof ROLE_OPTIONS)[number]['value']

type Stage = 'phone' | 'code'

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data?.error ?? 'خطایی رخ داد.' }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'عدم ارتباط با سرور.' }
  }
}

export function OtpLoginForm() {
  const router = useRouter()
  const [stage, setStage] = React.useState<Stage>('phone')
  const [role, setRole] = React.useState<Role>('customer')
  const [phone, setPhone] = React.useState('')
  const [code, setCode] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await post('/api/otp/request', { phone, role })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'خطایی رخ داد.')
      return
    }
    setStage('code')
    setCode('')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await post('/api/otp/verify', { phone, code })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'خطایی رخ داد.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const backToPhone = () => {
    setStage('phone')
    setCode('')
    setError(null)
  }

  return (
    <div className="border bg-background w-full max-w-md rounded-2xl p-6 shadow-sm md:p-8">
      <div className="mb-6 text-center">
        <div className="bg-primary/10 mx-auto mb-3 flex size-12 items-center justify-center rounded-xl">
          <Phone className="text-primary size-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">ورود با کد یکبارمصرف</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {stage === 'phone'
            ? 'شماره تماس خود را وارد کنید'
            : `کد ارسال‌شده به ‎${phone} را وارد کنید`}
        </p>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive mb-4 rounded-lg border px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {stage === 'phone' ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  role === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="text-sm font-medium">شماره تماس</label>
          <Input
            inputMode="tel"
            dir="ltr"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-center"
            required
          />

          <Button type="submit" disabled={pending || phone.trim().length < 8} className="w-full">
            {pending && <Loader2 className="animate-spin" />}
            ارسال کد
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <label className="text-sm font-medium">کد یکبارمصرف</label>
          <Input
            inputMode="numeric"
            dir="ltr"
            placeholder="----"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-base tracking-[0.4em]"
            required
            maxLength={6}
          />

          <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>برای تست در محیط توسعه کد {`1234`} است.</span>
          </div>

          <Button type="submit" disabled={pending || code.trim().length === 0} className="w-full">
            {pending && <Loader2 className="animate-spin" />}
            ورود
          </Button>

          <button
            type="button"
            onClick={backToPhone}
            className="text-muted-foreground hover:text-foreground text-center text-sm underline-offset-4 hover:underline"
          >
            تغییر شماره
          </button>
        </form>
      )}
    </div>
  )
}
