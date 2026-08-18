import { OtpLoginForm } from '@/components/auth/OtpLoginForm'
import { Container } from '@/components/layout/Container'

export const metadata = { title: 'ورود' }

export default function LoginPage() {
  return (
    <Container className="flex justify-center py-12 md:py-20">
      <OtpLoginForm />
    </Container>
  )
}
