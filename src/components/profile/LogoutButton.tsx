'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const logout = async () => {
    if (pending) return
    setPending(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {
      // Even on network failure, send the user to the login page.
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={logout} disabled={pending} className="text-destructive">
      <LogOut className="size-4" />
      خروج از حساب
    </Button>
  )
}
